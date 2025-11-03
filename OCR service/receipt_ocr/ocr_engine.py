"""
OCR engine using docTR with support for images and PDFs.
"""
import os
import time
import logging
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path

import torch
import numpy as np
import cv2
from PIL import Image
from io import BytesIO
from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from pdf2image import convert_from_path, convert_from_bytes

logger = logging.getLogger(__name__)

# Global predictor instance (lazy loaded)
_predictor = None


def get_predictor(det_arch: str = "db_resnet50", reco_arch: str = "crnn_vgg16_bn"):
    """Lazy load and return the docTR OCR predictor.

    Caches only the primary (default) combo; alternates are created on demand.
    """
    global _predictor
    if det_arch == "db_resnet50" and reco_arch == "crnn_vgg16_bn":
        if _predictor is None:
            logger.info("Loading docTR models (db_resnet50 + crnn_vgg16_bn)...")
            torch.set_num_threads(4)  # Stability on CPU
            _predictor = ocr_predictor(
                det_arch=det_arch,
                reco_arch=reco_arch,
                pretrained=True,
                assume_straight_pages=True
            )
            logger.info("docTR models loaded.")
        return _predictor
    # Alternate predictor (no caching to keep memory low)
    logger.info(f"Loading alternate docTR recognizer: {det_arch} + {reco_arch}...")
    return ocr_predictor(
        det_arch=det_arch,
        reco_arch=reco_arch,
        pretrained=True,
        assume_straight_pages=True,
    )


def preprocess_image(img: Image.Image, max_side: int = 2000) -> Image.Image:
    """
    Preprocess PIL image: convert to RGB and optionally resize if too large.
    """
    if img.mode != "RGB":
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        logger.debug(f"Resized image from {w}x{h} to {new_w}x{new_h}")
    return img


def enhance_for_ocr(img: Image.Image) -> Image.Image:
    """Enhance low-contrast/blurred receipts for OCR.

    - Grayscale + CLAHE
    - Adaptive threshold
    - Light denoise and upscaling if small
    """
    arr = np.asarray(img)
    # Grayscale
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    # Denoise slightly
    gray = cv2.bilateralFilter(gray, d=7, sigmaColor=50, sigmaSpace=50)
    # Contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(gray)
    # Binarize
    th = cv2.adaptiveThreshold(cl, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10)
    # Upscale if small
    h, w = th.shape
    scale = 1.5 if max(h, w) < 1200 else 1.0
    if scale > 1.0:
        th = cv2.resize(th, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
    # Back to RGB
    rgb = cv2.cvtColor(th, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(rgb)


def pdf_to_images(pdf_path: str, page_limit: int = 10, dpi: int = 200) -> List[Image.Image]:
    """
    Convert PDF pages to PIL images using pdf2image (requires Poppler).
    """
    logger.info(f"Converting PDF {pdf_path} to images (DPI={dpi}, limit={page_limit})...")
    try:
        images = convert_from_path(pdf_path, dpi=dpi, first_page=1, last_page=page_limit)
        logger.info(f"Converted {len(images)} page(s) from PDF.")
        return images
    except Exception as e:
        logger.error(f"PDF conversion failed: {e}")
        raise RuntimeError(f"pdf2image failed. Ensure Poppler is installed and in PATH. Error: {e}")


def run_ocr(
    file_path: str,
    min_confidence: float = 0.3,
    page_limit: int = 10,
    return_blocks: bool = False
) -> Dict[str, Any]:
    """
    Run docTR OCR on an image or PDF file.

    Args:
        file_path: Path to image or PDF
        min_confidence: Minimum word confidence to include
        page_limit: Max pages to process for PDFs
        return_blocks: Whether to include structured blocks in output

    Returns:
        Dict with keys:
            - text: concatenated OCR text
            - pages: list of page dicts with lines and words
            - confidences: list of all word confidences
            - average_confidence: mean confidence
            - median_confidence: median confidence
            - page_count: number of pages processed
            - inference_ms: total inference time
            - detector: detector model name
            - recognizer: recognizer model name
            - blocks: optional structured blocks
    """
    predictor = get_predictor()
    reco_used = "crnn_vgg16_bn"
    det_used = "db_resnet50"
    file_path = Path(file_path)
    ext = file_path.suffix.lower()

    # Load images
    start_time = time.perf_counter()
    if ext == ".pdf":
        images = pdf_to_images(str(file_path), page_limit=page_limit, dpi=200)
        images = [preprocess_image(img) for img in images]
        logger.info(f"Running OCR on {len(images)} page(s)...")
        use_path_first = False
    elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
        # For images, try letting docTR read directly from disk path first
        images = None  # defer PIL loading unless we need fallbacks
        logger.info("Running OCR on 1 page(s)...")
        use_path_first = True
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    # Helper to run predictor on a list of PIL images
    def run_predict(pil_images: List[Image.Image]):
        img_bytes_list = []
        for im in pil_images:
            buf = BytesIO()
            im.save(buf, format="PNG")
            img_bytes_list.append(buf.getvalue())
        np_pages = DocumentFile.from_images(img_bytes_list)
        return predictor(np_pages)

    # First pass
    if use_path_first:
        # Read using docTR's OpenCV-based loader
        np_pages = DocumentFile.from_images(str(file_path))
        result = predictor(np_pages)
    else:
        result = run_predict(images)
    inference_ms = (time.perf_counter() - start_time) * 1000

    # Export result
    export = result.export()
    pages_data = []
    all_confidences = []

    # If nothing detected, try enhanced preprocessing and a second pass
    nothing_detected = not export.get("pages") or all(
        len(p.get("blocks", [])) == 0 for p in export.get("pages", [])
    )
    if nothing_detected:
        logger.debug("No text detected on first pass; running enhanced preprocessing...")
        # Load PIL image(s) now if we haven't already
        if images is None:
            base_img = Image.open(file_path)
            base_img = preprocess_image(base_img)
            images = [base_img]
        enhanced_images = [enhance_for_ocr(img) for img in images]
        start_time = time.perf_counter()
        result = run_predict(enhanced_images)
        inference_ms = (time.perf_counter() - start_time) * 1000
        export = result.export()
        # Still nothing? Try 90/270 deg rotations
        still_nothing = not export.get("pages") or all(
            len(p.get("blocks", [])) == 0 for p in export.get("pages", [])
        )
        if still_nothing:
            logger.debug("Still nothing after enhancement; trying rotated variants...")
            for angle in (90, 270):
                rotated = [img.rotate(angle, expand=True) for img in enhanced_images]
                start_time = time.perf_counter()
                result = run_predict(rotated)
                inference_ms = (time.perf_counter() - start_time) * 1000
                export = result.export()
                if export.get("pages") and any(len(p.get("blocks", [])) > 0 for p in export.get("pages", [])):
                    images = rotated
                    break

    # Build pages/lines from export
    for page_idx, page in enumerate(export.get("pages", [])):
        page_lines = []
        for block in page.get("blocks", []):
            for line in block.get("lines", []):
                line_text = ""
                line_words = []
                for word in line.get("words", []):
                    value = word.get("value", "")
                    conf = word.get("confidence", 0.0)
                    if conf >= min_confidence:
                        line_text += value + " "
                        line_words.append({"word": value, "confidence": conf})
                        all_confidences.append(conf)
                if line_words:
                    page_lines.append({"text": line_text.strip(), "words": line_words})
        pages_data.append({"page": page_idx + 1, "lines": page_lines})

    # Concatenate all text
    full_text = "\n".join(
        line["text"] for page in pages_data for line in page["lines"]
    )

    # If text is still too short, try heavier recognizers as fallbacks
    if len(full_text.strip()) < 10:
        for reco_alt in ("satrn_base", "vitstr_base", "parseq"):
            try:
                alt_predictor = get_predictor(reco_arch=reco_alt)
                logger.debug(f"Primary recognizer produced too little text; retrying with {reco_alt}...")
                # Reuse latest image set if available, else read from disk path
                if images is None:
                    np_pages = DocumentFile.from_images(str(file_path))
                    result_alt = alt_predictor(np_pages)
                else:
                    # Use run_predict helper on images
                    result_alt = run_predict(images)
                export_alt = result_alt.export()
                # Rebuild pages
                pages_data = []
                all_confidences = []
                for page_idx, page in enumerate(export_alt.get("pages", [])):
                    page_lines = []
                    for block in page.get("blocks", []):
                        for line in block.get("lines", []):
                            line_text = ""
                            line_words = []
                            for word in line.get("words", []):
                                value = word.get("value", "")
                                conf = word.get("confidence", 0.0)
                                if conf >= min_confidence:
                                    line_text += value + " "
                                    line_words.append({"word": value, "confidence": conf})
                                    all_confidences.append(conf)
                            if line_words:
                                page_lines.append({"text": line_text.strip(), "words": line_words})
                    pages_data.append({"page": page_idx + 1, "lines": page_lines})
                full_text = "\n".join(line["text"] for page in pages_data for line in page["lines"])
                export = export_alt
                reco_used = reco_alt
                if len(full_text.strip()) >= 10:
                    break
            except Exception as e:
                logger.debug(f"Alternate recognizer {reco_alt} failed: {e}")

    # If still too short, try PaddleOCR backend
    if len(full_text.strip()) < 10:
        try:
            from paddleocr import PaddleOCR
            logger.debug("Trying PaddleOCR fallback (en)...")
            # Initialize once per call
            paddle = PaddleOCR(use_angle_cls=True, lang='en', show_log=False, det=True, rec=True)
            # Prepare images
            if images is None:
                base_img = Image.open(file_path).convert("RGB")
                imgs_for_paddle = [base_img]
            else:
                imgs_for_paddle = images
            pages_data = []
            all_confidences = []
            start_time = time.perf_counter()
            for idx, im in enumerate(imgs_for_paddle):
                arr_rgb = np.asarray(im)
                arr_bgr = cv2.cvtColor(arr_rgb, cv2.COLOR_RGB2BGR)
                res = paddle.ocr(arr_bgr, cls=True)
                line_items = []
                for det in res:
                    for bbox, (text, conf) in det:
                        text = (text or "").strip()
                        if not text:
                            continue
                        if conf is None:
                            conf = 0.0
                        if conf < min_confidence:
                            continue
                        line_items.append({"text": text, "words": [{"word": text, "confidence": float(conf)}]})
                        all_confidences.append(float(conf))
                pages_data.append({"page": idx + 1, "lines": line_items})
            inference_ms = (time.perf_counter() - start_time) * 1000
            full_text = "\n".join(l["text"] for p in pages_data for l in p["lines"]) if pages_data else ""
            if full_text.strip():
                export = {"pages": []}
                reco_used = "paddleocr_en"
                det_used = "paddle"
        except Exception as e:
            logger.debug(f"PaddleOCR fallback not available or failed: {e}")

    # If still nothing meaningful, try Tesseract as a last-resort fallback (if available)
    if len(full_text.strip()) < 10:
        try:
            import pytesseract
            logger.debug("Trying Tesseract fallback (psm 6)...")
            if images is None:
                pil_img = Image.open(file_path).convert("RGB")
            else:
                pil_img = images[0]
            # Run OCR
            data = pytesseract.image_to_data(
                pil_img,
                output_type=pytesseract.Output.DICT,
                config="--oem 1 --psm 6",
                lang="eng",
            )
            n = len(data.get("text", []))
            lines_by_id = {}
            for i in range(n):
                txt = (data["text"][i] or "").strip()
                try:
                    conf = float(data["conf"][i]) / 100.0
                except Exception:
                    conf = 0.0
                if not txt:
                    continue
                if conf < min_confidence:
                    continue
                key = (data.get("block_num", [0])[i], data.get("par_num", [0])[i], data.get("line_num", [0])[i])
                lines_by_id.setdefault(key, []).append({"word": txt, "confidence": conf})
            # Build pages_data from lines
            pages_data = []
            line_items = []
            for _, words in lines_by_id.items():
                line_text = " ".join(w["word"] for w in words)
                line_items.append({"text": line_text, "words": words})
                for w in words:
                    all_confidences.append(w["confidence"])
            if line_items:
                pages_data.append({"page": 1, "lines": line_items})
            full_text = "\n".join(l["text"] for l in line_items)
            export = {"pages": []}
        except Exception as e:
            logger.debug(f"Tesseract fallback not available or failed: {e}")

    # Compute stats
    avg_conf = float(np.mean(all_confidences)) if all_confidences else 0.0
    med_conf = float(np.median(all_confidences)) if all_confidences else 0.0
    page_count = len(export.get("pages", [])) or (1 if pages_data else 0)

    output = {
        "text": full_text,
        "pages": pages_data,
        "confidences": all_confidences,
        "average_confidence": avg_conf,
        "median_confidence": med_conf,
        "page_count": page_count,
        "inference_ms": round(inference_ms, 2),
        "detector": det_used,
        "recognizer": reco_used,
    }

    if return_blocks:
        output["blocks"] = export.get("pages", [])

    logger.info(f"OCR complete: {len(pages_data)} pages, avg_conf={avg_conf:.2f}, time={inference_ms:.0f}ms")
    return output
