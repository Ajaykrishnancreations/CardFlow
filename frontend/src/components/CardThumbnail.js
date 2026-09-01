import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CreditCard } from 'lucide-react';
import { colors, radii } from '../theme';
import { fetchCardOriginalImageUrl, cardOriginalImagePath } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function CardThumbnail({ cardId, imagePath, size = 72 }) {
  const { token } = useAuth();
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let blobUrl = null;
    let cancelled = false;
    const load = async () => {
      if (!token || !cardId) return;
      const path = imagePath || cardOriginalImagePath(cardId, 'front');
      const next = await fetchCardOriginalImageUrl(path, token);
      blobUrl = next;
      if (!cancelled) setUrl(next);
    };
    load();
    return () => {
      cancelled = true;
      if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
    };
  }, [cardId, imagePath, token]);

  if (!url) {
    return (
      <View style={[styles.fallback, { width: size, height: size * 0.62 }]}>
        <CreditCard size={18} color={colors.primary} />
      </View>
    );
  }

  return (
    <img
      src={url}
      alt=""
      style={{
        width: size,
        height: size * 0.62,
        objectFit: 'cover',
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: '#1A1228'
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  }
});
