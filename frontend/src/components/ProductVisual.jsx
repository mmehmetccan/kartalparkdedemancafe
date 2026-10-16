import { useCallback, useEffect, useRef, useState } from 'react';
import { PRODUCT_STAGE_BACKGROUND_IMAGE, publicAsset } from '../lib/publicAsset';
import '../styles/Guest/ProductVisual.css';

const STAGE_BACKGROUND_PUBLIC = publicAsset('menu-products/motion/product-stage-background.webp');

const ProductVisual = ({ imageSrc, cutoutSrc, alt, eager = false, children }) => {
  const frameRef = useRef(null);
  const [failedSources, setFailedSources] = useState([]);
  const [backgroundSrc, setBackgroundSrc] = useState(STAGE_BACKGROUND_PUBLIC || PRODUCT_STAGE_BACKGROUND_IMAGE);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [settled, setSettled] = useState(false);
  const source = [cutoutSrc, imageSrc].find((url) => url && !failedSources.includes(url));
  const isCutout = Boolean(cutoutSrc && source === cutoutSrc);
  const phase = ready && inView ? (settled ? 'settled' : 'entering') : 'waiting';

  // Önbellekten hemen yüklenen resimlerde de hazır olma durumunu yakala.
  const imageRef = useCallback((image) => {
    if (image?.complete && image.naturalWidth > 0) setReady(true);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    if (!('IntersectionObserver' in window)) {
      const request = window.requestAnimationFrame(() => setInView(true));
      return () => window.cancelAnimationFrame(request);
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) setSettled(false);
    }, { threshold: 0.12 });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const handleImageError = () => {
    setReady(false);
    setSettled(false);
    setFailedSources((current) => [...current, source]);
  };

  return (
    <div
      ref={frameRef}
      className="guest-product-image guest-product-visual"
      data-reveal-state={phase}
      data-product-cutout={isCutout ? 'true' : 'false'}
    >
      {backgroundSrc && <img
        className="guest-product-visual-background"
        src={backgroundSrc}
        alt=""
        aria-hidden="true"
        onError={() => {
          if (PRODUCT_STAGE_BACKGROUND_IMAGE && backgroundSrc !== PRODUCT_STAGE_BACKGROUND_IMAGE) {
            setBackgroundSrc(PRODUCT_STAGE_BACKGROUND_IMAGE);
          }
        }}
      />}
      {source && <img
        key={source}
        ref={imageRef}
        className="guest-product-visual-layer"
        src={source}
        alt={alt}
        loading={eager || inView ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setReady(true)}
        onError={handleImageError}
        onAnimationEnd={(event) => {
          if (event.animationName === 'guest-product-visual-enter') setSettled(true);
        }}
      />}
      {children}
    </div>
  );
};

export default ProductVisual;
