import { useState } from "react";
import PageShell from "./PageShell";
import ServiceSearchPanel from "../components/ServiceSearchPanel";
import AddStoreForm from "../components/AddStoreForm";
import NoResultsModal from "../components/NoResultsModal";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const POOJA_STORE_OWNER_PROMPT_KEY = "panchang:pooja-store-owner-prompt-seen";

function shouldShowOwnerPrompt() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(POOJA_STORE_OWNER_PROMPT_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function PoojaStoresPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const title = t.poojaStores || "Pooja Stores";
  const subtitle = t.poojaStoresSubtitle || "Nearby pooja stores and search";
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOwnerPrompt, setShowOwnerPrompt] = useState(shouldShowOwnerPrompt);
  const [servicePanelKey, setServicePanelKey] = useState(0);
  const [recentStores, setRecentStores] = useState([]);

  const markOwnerPromptSeen = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(POOJA_STORE_OWNER_PROMPT_KEY, "1");
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

  const handleAddStore = (newStore) => {
    if (newStore) {
      setRecentStores((prev) => [newStore, ...prev]);
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
          message={t.poojaStoresOwnerPrompt || "If you are the owner of a pooja store, be the first to add one in your area."}
          actionLabel={t.poojaStoresAddButton || "Add Pooja Store"}
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
            {t.poojaStoresAddButton || "Add Pooja Store"}
          </button>
        </div>

        {showAddForm && (
          <AddStoreForm
            onAdd={handleAddStore}
            onClose={() => setShowAddForm(false)}
          />
        )}

        <ServiceSearchPanel
          key={servicePanelKey}
          serviceType="store"
          title={title}
          subtitle={subtitle}
          recentItems={recentStores}
          noResultsModalConfig={{
            title: "",
            message: t.poojaStoresOwnerPrompt || "If you are the owner of a pooja store, be the first to add one in your area.",
            actionLabel: t.poojaStoresAddButton || "Add Pooja Store",
            onAction: openAddForm,
          }}
        />
      </div>
    </PageShell>
  );
}
