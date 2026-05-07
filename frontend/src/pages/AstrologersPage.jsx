import { useState } from "react";
import PageShell from "./PageShell";
import ServiceSearchPanel from "../components/ServiceSearchPanel";
import AddAstrologerForm from "../components/AddAstrologerForm";
import NoResultsModal from "../components/NoResultsModal";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const ASTROLOGER_OWNER_PROMPT_KEY = "panchang:astrologer-owner-prompt-seen";

function shouldShowOwnerPrompt() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ASTROLOGER_OWNER_PROMPT_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function AstrologersPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const title = t.astrologers || "Astrologers";
  const subtitle = t.astrologersSubtitle || "Nearby astrologers and search";
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOwnerPrompt, setShowOwnerPrompt] = useState(shouldShowOwnerPrompt);
  const [servicePanelKey, setServicePanelKey] = useState(0);
  const [recentAstrologers, setRecentAstrologers] = useState([]);

  const markOwnerPromptSeen = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ASTROLOGER_OWNER_PROMPT_KEY, "1");
    } catch {
      // Ignore storage failures and keep the UI usable.
    }
  };

  const closeOwnerPrompt = () => {
    markOwnerPromptSeen();
    setShowOwnerPrompt(false);
  };

  const openAddForm = () => {
    markOwnerPromptSeen();
    setShowOwnerPrompt(false);
    setShowAddForm(true);
  };

  const handleAddAstrologer = (newAstrologer) => {
    if (newAstrologer) {
      setRecentAstrologers((prev) => [newAstrologer, ...prev]);
    }
    setServicePanelKey((prev) => prev + 1);
  };

  return (
    <PageShell title={title} transparent>
      <div className="mx-auto w-full max-w-4xl">
        <NoResultsModal
          isOpen={showOwnerPrompt}
          onClose={closeOwnerPrompt}
          title=""
          message="If you are an astrologer,\nBe the first to add an astrologer within this area."
          actionLabel={t.addAstrologerButton || "Add Astrologer"}
          onAction={openAddForm}
        />

        <div className="mb-4 flex justify-end">
          <button
            onClick={openAddForm}
            className="rounded-xl px-4 py-2 text-xs font-black text-amber-100 transition hover:scale-[1.01]"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              boxShadow: "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
          >
            {t.addAstrologerButton || "Add Astrologer"}
          </button>
        </div>

        {showAddForm && (
          <AddAstrologerForm
            onAdd={handleAddAstrologer}
            onClose={() => setShowAddForm(false)}
          />
        )}

        <ServiceSearchPanel
          key={servicePanelKey}
          serviceType="astrologer"
          title={title}
          subtitle={subtitle}
          recentItems={recentAstrologers}
          noResultsModalConfig={{
            title: "",
            message: "If you are an astrologer,\nBe the first to add an astrologer within this area.",
            actionLabel: t.addAstrologerButton || "Add Astrologer",
            onAction: openAddForm,
          }}
        />
      </div>
    </PageShell>
  );
}
