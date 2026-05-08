import { useState } from "react";
import PageShell from "./PageShell";
import ServiceSearchPanel from "../components/ServiceSearchPanel";
import AddPurohithForm from "../components/AddPurohithForm";
import NoResultsModal from "../components/NoResultsModal";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const PUROHITH_OWNER_PROMPT_KEY = "panchang:purohith-owner-prompt-seen";

function shouldShowOwnerPrompt() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PUROHITH_OWNER_PROMPT_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function PurohithPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const title = t.purohith || "Purohith";
  const subtitle = t.purohithSubtitle || "Nearby purohiths and search";
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOwnerPrompt, setShowOwnerPrompt] = useState(shouldShowOwnerPrompt);
  const [servicePanelKey, setServicePanelKey] = useState(0);
  const [recentPurohits, setRecentPurohits] = useState([]);

  const markOwnerPromptSeen = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PUROHITH_OWNER_PROMPT_KEY, "1");
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

  const handleAddPurohith = (newPurohith) => {
    if (newPurohith) {
      setRecentPurohits((prev) => [newPurohith, ...prev]);
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
          message={"If you are a purohith,\nBe the first to add a purohith within this area."}
          actionLabel={t.addPurohithButton || "Add Purohith"}
          onAction={openAddForm}
        />

        {/* Button to add new purohith */}
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
            {t.addPurohithButton || "Add Purohith"}
          </button>
        </div>

        {/* Add Purohith Form (Modal) */}
        {showAddForm && (
          <AddPurohithForm
            onAdd={handleAddPurohith}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Service Search Panel for nearby purohiths */}
        <ServiceSearchPanel
          key={servicePanelKey}
          serviceType="purohit"
          title={title}
          subtitle={subtitle}
          recentItems={recentPurohits}
        />
      </div>
    </PageShell>
  );
}
