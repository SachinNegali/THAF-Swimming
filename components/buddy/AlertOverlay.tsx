import React from 'react';
import { AlertKind, Buddy } from '../../types';
import { ImportantBanner } from './ImportantBanner';
import { RegularToast } from './RegularToast';
import { SosOverlay } from './SosOverlay';

interface AlertOverlayProps {
  kind: AlertKind;
  toastBuddy?: Buddy;
  onDismiss: () => void;
}

export const AlertOverlay = React.memo(({ kind, toastBuddy, onDismiss }: AlertOverlayProps) => {
  if (kind === 'sos') {
    return (
      <SosOverlay
        fromName="Anjali"
        distance="2.3 km"
        location="NH-48 near Khopoli ghats"
        speedAtAlert="0 km/h"
        battery="64%"
        signal="Strong"
        time="2:14 PM"
        broadcastTo="5 pack riders · emergency contact (Sister) · local responders"
        onDismiss={onDismiss}
      />
    );
  }

  if (kind === 'important') {
    return (
      <ImportantBanner
        fromCs="Wire"
        message="Landslide debris on the inside lane after km 87."
        meta="14 sec ago · marked on map · pinned 30 min"
        onDismiss={onDismiss}
      />
    );
  }

  if (kind === 'regular' && toastBuddy) {
    return (
      <RegularToast
        fromName={toastBuddy.name}
        fromCs={toastBuddy.cs}
        message="Photo break ahead"
        tone={toastBuddy.tone}
        onDismiss={onDismiss}
      />
    );
  }

  return null;
});
