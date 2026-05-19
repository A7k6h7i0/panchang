import ServiceDetailPage from "./ServiceDetailPage";
import { useParams } from "react-router-dom";

export default function AstrologerDetailPage() {
  const params = useParams();
  return (
    <ServiceDetailPage
      key={params.serviceId || params.itemId}
      serviceType="astrologer"
      pageTitle="Astrologers"
      backTo="/astrologers"
      backLabel="Back to Astrologers"
      showHeaderAddress={false}
      showDirections={false}
    />
  );
}
