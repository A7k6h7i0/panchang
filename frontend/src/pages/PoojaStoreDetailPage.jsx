import ServiceDetailPage from "./ServiceDetailPage";
import { useParams } from "react-router-dom";

export default function PoojaStoreDetailPage() {
  const params = useParams();
  return (
    <ServiceDetailPage
      key={params.serviceId || params.itemId}
      serviceType="store"
      pageTitle="Pooja Store"
      backTo="/pooja-stores"
      backLabel="Back to Pooja Stores"
      showHeaderAddress={false}
      showDirections={false}
    />
  );
}
