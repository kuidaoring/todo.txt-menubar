import { useEffect, useRef } from "react/cjs/react.development";
import "./MessageArea.css";

const defaultHideDurationMsec = 3000;

const MessageArea = ({ show, message, onClose, hideDurationMsec }) => {
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (show) {
      timer.current = setTimeout(() => {
        timer.current = null;
        onClose && onClose();
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
