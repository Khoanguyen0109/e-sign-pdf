import axios from "axios";

export const getCertificateInfoApi = async (userId) => {
  try {
    const res = await axios.post("http://157.66.81.136:8090/getCertList", {
      userId: userId,
    });
    return res.data.certList;
  } catch (error) {
    console.log("error", error);
  }
};

export const getSignPdfInfo = async ({
  user_id,
  serialNumber,
  document_id,
  dataDisplay,
  document_base64,
  contact,
  reason,
  signDate,
  left,
  top,
  location,
  numberPageSign,
}) => {
  const body = {
    userId: user_id,
    checkCertValid: true,
    serialNumber,
    docID: Math.floor(Math.random() * 2147483647) + 1,
    dataDisplay: dataDisplay,
    fileSignedResponseType: 1,
    timestampConfig: {
      useTimestamp: false,
    },
    displayTextConfigBO: {
      locateSign: 1,
      numberPageSign: numberPageSign,
      widthRectangle: 200,
      heightRectangle: 150,
      marginTopOfRectangle: top,
      marginLeftOfRectangle: left,
      formatRectangleText:
        "Người Ký: %s\r\nNgày Ký: %s\r\nLý Do: %s\r\nĐịa Điểm: %s",
      contact,
      reason,
      location,
      signDate,
      fontPath: "fonts/times.ttf",
      dateFormatString: "dd/MM/yyyy",
      sizeFont: 12,
      organizationUnit: "",
      organization: "",
    },
    fileBase64: document_base64,
  };
  try {
    const mysignres = await axios.post(
      `http://157.66.81.136:8090/signPdfBase64TextDisplay`,
      {
        ...body,
      }
    );
    return mysignres.data;
  } catch (error) {
    console.log("error", error);
  }
};
