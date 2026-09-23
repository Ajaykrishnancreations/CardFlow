import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check, RotateCcw } from 'lucide-react';
import { colors, radii, spacing, typography } from '../theme';
import { warpQuadToRect } from '../utils/perspectiveCrop';

const CORNER_KEYS = ['tl', 'tr', 'br', 'bl'];
const INSET_RATIO = 0.04; // default corners start 4% in from the raw photo's edges
const OUTPUT_ASPECT = 1.6; // standard landscape business-card ratio (~ISO 216-ish)
const OUTPUT_WIDTH = 1200;

function defaultCorners(width, height) {
  const ix = width * INSET_RATIO;
  const iy = height * INSET_RATIO;
  return {
    tl: { x: ix, y: iy },
    tr: { x: width - ix, y: iy },
    br: { x: width - ix, y: height - iy },
    bl: { x: ix, y: height - iy }
  };
}

// Lets the user drag the 4 corners of the just-captured photo onto the
// card's real edges, then straightens/crops the photo to that quad before
// handing off a corrected image. Skipping just passes the original photo
// through untouched.
export function CardCornerAdjuster({ imageSrc, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const [natural, setNatural] = useState(null); // { width, height } of the source photo
  const [display, setDisplay] = useState(null); // { width, height } as rendered on screen
  const [corners, setCorners] = useState(null); // display-space points
  const [dragKey, setDragKey] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      setNatural({ width: nw, height: nh });
      const containerWidth = containerRef.current?.clientWidth || 340;
      const dw = containerWidth;
      const dh = Math.round((nh / nw) * dw);
      setDisplay({ width: dw, height: dh });
      setCorners(defaultCorners(dw, dh));
    };
    img.src = imageSrc;
    return () => { cancelled = true; };
  }, [imageSrc]);

  useEffect(() => {
    if (!dragKey) return;
    const handleMove = (clientX, clientY) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.min(Math.max(clientX - rect.left, 0), display.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), display.height);
      setCorners((prev) => ({ ...prev, [dragKey]: { x, y } }));
    };
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    };
    const endDrag = () => setDragKey(null);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endDrag);
    };
  }, [dragKey, display]);

  const handleReset = () => {
    if (!display) return;
    setCorners(defaultCorners(display.width, display.height));
  };

  const handleConfirm = async () => {
    if (!corners || !natural || !display) {
      onConfirm(imageSrc);
      return;
    }
    setProcessing(true);
    try {
      const scaleX = natural.width / display.width;
      const scaleY = natural.height / display.height;
      const sourceCorners = {
        tl: { x: corners.tl.x * scaleX, y: corners.tl.y * scaleY },
        tr: { x: corners.tr.x * scaleX, y: corners.tr.y * scaleY },
        br: { x: corners.br.x * scaleX, y: corners.br.y * scaleY },
        bl: { x: corners.bl.x * scaleX, y: corners.bl.y * scaleY }
      };
      const outputHeight = Math.round(OUTPUT_WIDTH / OUTPUT_ASPECT);
      const corrected = await warpQuadToRect(imageSrc, sourceCorners, OUTPUT_WIDTH, outputHeight);
      onConfirm(corrected);
    } catch (err) {
      console.warn('Perspective correction failed, using original photo:', err);
      onConfirm(imageSrc);
    } finally {
      setProcessing(false);
    }
  };

  const quadPath = corners
    ? `M ${corners.tl.x} ${corners.tl.y} L ${corners.tr.x} ${corners.tr.y} L ${corners.br.x} ${corners.br.y} L ${corners.bl.x} ${corners.bl.y} Z`
    : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Adjust the card edges</Text>
      <Text style={styles.subtitle}>Drag each dot onto a corner of the card, then confirm.</Text>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: display ? display.height : 220,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1A1228',
          touchAction: 'none'
        }}
      >
        <img
          src={imageSrc}
          alt="Captured card"
          draggable={false}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain', userSelect: 'none' }}
        />
        {display && corners ? (
          <svg
            width={display.width}
            height={display.height}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <path d={quadPath} fill="rgba(184,148,69,0.18)" stroke={colors.gold} strokeWidth="3" strokeDasharray="8 6" />
          </svg>
        ) : null}
        {display && corners
          ? CORNER_KEYS.map((key) => (
              <div
                key={key}
                onMouseDown={() => setDragKey(key)}
                onTouchStart={() => setDragKey(key)}
                style={{
                  position: 'absolute',
                  left: corners[key].x - 16,
                  top: corners[key].y - 16,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: '#FFFFFF',
                  border: `4px solid ${colors.danger}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  cursor: 'grab',
                  touchAction: 'none'
                }}
              />
            ))
          : null}
      </div>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} disabled={processing}>
          <RotateCcw size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.resetText}>Reset corners</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => onConfirm(imageSrc)} disabled={processing}>
          <Text style={styles.skipText}>Use as captured</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={processing}>
        {processing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.confirmText}>Confirm & Straighten</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} disabled={processing} style={{ marginTop: spacing.sm }}>
        <Text style={styles.cancelText}>Retake instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { ...typography.titleSmall, marginBottom: 2 },
  subtitle: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.sm },
  resetBtn: { flexDirection: 'row', alignItems: 'center' },
  resetText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  skipBtn: {},
  skipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radii.lg
  },
  confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.textMuted, fontSize: 13, fontWeight: '600' }
});
