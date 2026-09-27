import { QRCodeSVG } from "qrcode.react";
import { Modal } from "./ui";

export function QRCodeModal({
  open,
  code,
  onClose,
}: {
  open: boolean;
  code: string;
  onClose: () => void;
}) {
  const url = `${window.location.origin}${window.location.pathname}`;
  return (
    <Modal open={open} onClose={onClose} title="Invita gli ospiti">
      <div className="flex flex-col items-center gap-5">
        <div className="rounded-lg bg-parchment-100 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <QRCodeSVG value={url} size={190} fgColor="#0B0F19" bgColor="#EFE6D2" />
        </div>
        <p className="text-center text-base text-parchment-400">
          Scansiona il QR Code, oppure inserisci manualmente il codice stanza:
        </p>
        <p className="font-display text-3xl tracking-[0.45em] text-gold-300 select-all">{code}</p>
      </div>
    </Modal>
  );
}
