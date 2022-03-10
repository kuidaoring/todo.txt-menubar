import React, { useEffect, useRef } from "react";
import "./MessageArea.css";

const defaultHideDurationMsec = 3000;

interface Props {
  show: boolean;
  message: string;
  onClose: () => void;
  hideDurationMsec?: number;
}

const MessageArea: React.FC<Props> = ({
  show,
  message,
  onClose,
  hideDurationMsec,
}) => {
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (show) {
      timer.current = setTimeout(() => {
        timer.current = null;
        onClose();
      }, hideDurationMsec || defaultHideDurationMsec);
    }
  }, [show, message, hideDurationMsec, onClose]);
  return (
    <div className="message-container">
      <p className={`message ${show ? "" : "hidden"}`}>{message}</p>
    </div>
  );
};

export default MessageArea;
