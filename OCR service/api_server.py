"""
Flask API server wrapper for the receipt OCR service.
This wraps the existing OCR CLI functionality into an HTTP API.

Usage:
    python api_server.py

Or with custom port:
    python api_server.py --port 8000
"""
import os
import sys
import argparse
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid

# Add the receipt_ocr package to path
sys.path.insert(0, str(Path(__file__).parent))

from receipt_ocr.ocr_engine import run_ocr
from receipt_ocr.receipt_parser import parse_receipt
from receipt_ocr.logging_utils import setup_logging

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'tiff', 'bmp', 'pdf'}
UPLOAD_FOLDER = tempfile.gettempdir()
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'receipt-ocr'})


@app.route('/api/ocr', methods=['POST'])
def process_ocr():
    """
    Process receipt OCR from uploaded file.
    
    Accepts:
        - file: Image or PDF file (multipart/form-data)
        - language: Optional, default 'en'
        - min_confidence: Optional, default 0.3
        - return_text: Optional, default False
        - return_blocks: Optional, default False
    
    Returns:
        JSON response matching ReceiptResponse schema
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'File type not allowed',
                'allowed_types': list(ALLOWED_EXTENSIONS)
            }), 400
        
        # Get optional parameters
        language = request.form.get('language', 'en')
        min_confidence = float(request.form.get('min_confidence', 0.3))
        return_text = request.form.get('return_text', 'false').lower() == 'true'
        return_blocks = request.form.get('return_blocks', 'false').lower() == 'true'
        
        # Save uploaded file to temp location
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
        
        try:
            file.save(temp_path)
            file_size = os.path.getsize(temp_path)
            
            # Run OCR
            app.logger.info(f"Processing file: {filename} ({file_size} bytes)")
            ocr_output = run_ocr(
                file_path=temp_path,
                min_confidence=min_confidence,
                page_limit=10,
                return_blocks=return_blocks
            )
            
            # Parse receipt
            receipt_response = parse_receipt(
                ocr_output=ocr_output,
                filename=filename,
                file_size=file_size,
                language=language,
                min_confidence=min_confidence,
                return_text=return_text
            )
            
            # Convert to dict for JSON response
            result = receipt_response.model_dump(mode='json')
            
            app.logger.info(f"Successfully processed: {filename}")
            
            return jsonify(result)
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as e:
                    app.logger.warning(f"Failed to delete temp file {temp_path}: {e}")
    
    except Exception as e:
        app.logger.error(f"Error processing OCR: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to process OCR',
            'message': str(e)
        }), 500


@app.route('/api/ocr/batch', methods=['POST'])
def process_batch():
    """
    Process multiple receipt files in one request.
    
    Accepts:
        - files: Multiple files (multipart/form-data)
        - language: Optional, default 'en'
        - min_confidence: Optional, default 0.3
    
    Returns:
        JSON with results array and summary
    """
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        if not files or all(f.filename == '' for f in files):
            return jsonify({'error': 'No files selected'}), 400
        
        language = request.form.get('language', 'en')
        min_confidence = float(request.form.get('min_confidence', 0.3))
        return_text = request.form.get('return_text', 'false').lower() == 'true'
        
        job_id = str(uuid.uuid4())
        results = []
        errors = []
        
        for file in files:
            if file.filename == '':
                continue
            
            if not allowed_file(file.filename):
                errors.append({
                    'file': file.filename,
                    'error': 'File type not allowed'
                })
                continue
            
            try:
                filename = secure_filename(file.filename)
                temp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
                
                try:
                    file.save(temp_path)
                    file_size = os.path.getsize(temp_path)
                    
                    ocr_output = run_ocr(
                        file_path=temp_path,
                        min_confidence=min_confidence,
                        page_limit=10,
                        return_blocks=False
                    )
                    
                    receipt_response = parse_receipt(
                        ocr_output=ocr_output,
                        filename=filename,
                        file_size=file_size,
                        language=language,
                        min_confidence=min_confidence,
                        return_text=return_text
                    )
                    
                    results.append(receipt_response.model_dump(mode='json'))
                    
                finally:
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except Exception:
                            pass
            
            except Exception as e:
                errors.append({
                    'file': file.filename,
                    'error': str(e)
                })
        
        return jsonify({
            'job_id': job_id,
            'results': results,
            'errors': errors,
            'summary': {
                'total_files': len(files),
                'successful': len(results),
                'failed': len(errors)
            }
        })
    
    except Exception as e:
        app.logger.error(f"Error processing batch OCR: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to process batch OCR',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Receipt OCR API Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to run server on')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(level='INFO')
    
    print(f"Starting Receipt OCR API Server on http://{args.host}:{args.port}")
    print(f"Health check: http://{args.host}:{args.port}/health")
    print(f"OCR endpoint: http://{args.host}:{args.port}/api/ocr")
    
    app.run(host=args.host, port=args.port, debug=args.debug)

