import React, { useEffect, useRef } from 'react';
import { IonSpinner, IonText } from '@ionic/react';
import { gsap } from 'gsap';

const LoadingPage: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }

    if (contentRef.current) {
      gsap.to(contentRef.current, {
        scale: 1.05,
        repeat: -1,
        yoyo: true,
        duration: 1,
        ease: 'power1.inOut',
      });
    }

    return () => {
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        });
      }
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
      }}
    >
      <div
        ref={contentRef}
        style={{
          textAlign: 'center',
        }}
      >
        <IonSpinner name="lines-sharp" color="light" style={{ fontSize: '50px' }} />
        <IonText color="light">
          <p>Loading...</p>
        </IonText>
      </div>
    </div>
  );
};

export default LoadingPage;
