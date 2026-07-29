import { X } from "lucide-react";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl text-zinc-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black mb-4 pb-2 border-b border-zinc-800 bg-[linear-gradient(90deg,#f87171,#facc15,#34d399,#60a5fa)] bg-clip-text text-transparent">
          Règles : P2Uno
        </h2>

        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            Posez une carte de même <strong className="text-white">couleur</strong> ou{" "}
            <strong className="text-white">valeur</strong> que la défausse. Les jokers
            (Wild / +4) changent la couleur active.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-red-400">Skip</strong> — passe le joueur suivant
            </li>
            <li>
              <strong className="text-yellow-300">Reverse</strong> — inverse le sens
            </li>
            <li>
              <strong className="text-emerald-400">+2</strong> /{" "}
              <strong className="text-blue-400">+4</strong> — pénalité de pioche
            </li>
            <li>
              À 1 carte : bouton <strong className="text-white">UNO !</strong> — sinon{" "}
              <strong className="text-white">Contre UNO !</strong>
            </li>
          </ul>
          <p className="text-zinc-400 text-xs">
            Les house rules (Stacking, 7-0, Jump-In, Force Play…) se règlent dans le
            salon avant le départ.
          </p>
        </div>
      </div>
    </div>
  );
}
