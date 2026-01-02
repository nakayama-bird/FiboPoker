import { useState } from 'react';
import styles from '../styles/InvitationLink.module.css';

interface InvitationLinkProps {
  roomCode: string;
}

export function InvitationLink({ roomCode }: InvitationLinkProps) {
  const [copied, setCopied] = useState(false);
  const invitationUrl = `${window.location.origin}/join?code=${roomCode}`;

  const handleCopy = async () => {
    try {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(invitationUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = invitationUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invitation link:', error);
      alert('URLのコピーに失敗しました');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.linkWrapper}>
        <input
          type="text"
          value={invitationUrl}
          readOnly
          className={styles.linkInput}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="招待URLをコピー"
        >
          {copied ? '✓ コピー完了' : '📋 コピー'}
        </button>
      </div>
      {copied && (
        <div className={styles.toast} role="alert">
          招待リンクをコピーしました！
        </div>
      )}
    </div>
  );
}
