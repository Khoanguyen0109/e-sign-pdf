import "./App.css";
import PdfSignatureFromDrive from "./PdfSignatureFromDrive";
import { useEffect, useState } from "react";
import { getCertificateInfoApi } from "./api";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("fileId");
  const fileName = urlParams.get("fileName");
  const userId = urlParams.get("userId");

  const [certificates, setCertificates] = useState([]);

  const getCertificates = async () => {
    const res = await getCertificateInfoApi(userId);
    if (res) {
      setCertificates(res[0]);
    }
  };

  useEffect(() => {
    // if (isLogged) {
    getCertificates();
  }, []);

  return (
    <PdfSignatureFromDrive
      userId={userId}
      fileId={fileId}
      fileName={fileName}
      certificates={certificates}
    />
  );
}

export default App;
