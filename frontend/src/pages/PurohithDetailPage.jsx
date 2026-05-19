import ServiceDetailPage from "./ServiceDetailPage";
import { useParams } from "react-router-dom";

export default function PurohithDetailPage() {
  const params = useParams();
  return (
    <ServiceDetailPage
      key={params.purohithId}
      serviceType="purohit"
      pageTitle="Purohith"
      backTo="/purohith"
      backLabel="Back to Purohiths"
      showHeaderAddress={false}
      showDirections={false}
    />
  );
}
