import React, { useState, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  AppBar,
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";

import { saveAs } from "file-saver";
import { baseURL } from "./api/axiosInstance";
import { getSignPdfInfo } from "./api";
import { useSnackbar } from "notistack";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const base64ToBlob = (base64String) => {
  const byteCharacters = atob(base64String.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "application/pdf" });
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
const PDFViewerWithSignature = ({ certificates, userId, fileId, fileName }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [requestSignLoading, setRequestSignLoading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfBuffer, setPdfBuffer] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [width, setWidth] = useState(600);
  const pageRef = useRef();
  const [loading, setLoading] = useState(false);
  const [pageCanvas, setPageCanvas] = useState(null);

  const [formData, setFormData] = useState({
    reason: "",
    location: "",
    content: "",
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWidth(600);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchPdf = async () => {
    const proxyUrl = `${baseURL}/download-pdf`;
    setLoading(true);
    try {
      const response = await fetch(
        proxyUrl +
          "?" +
          new URLSearchParams({
            fileId: fileId,
          }).toString()
      );
      if (!response.ok) {
        throw new Error(`Error fetching the PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      setPdfBuffer(arrayBuffer);
    } catch (error) {
      enqueueSnackbar("Lấy file không thành công", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdf();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Function to capture click and set the signature position
  const handlePageClick = (e) => {
    const pageRect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - pageRect.left; // X relative to the PDF page
    const y = e.clientY - pageRect.top; // Y relative to the PDF page (top-left origin)

    setSignaturePosition({ page: pageNumber, x, y });
  };

  const fileSlice = useMemo(() => pdfBuffer?.slice(0), [pdfBuffer]);

  const handleRenderSuccess = (page) => {
    const canvas = document.querySelector(`.react-pdf__Page__canvas`);
    if (canvas) {
      setPageCanvas(canvas); // Store the canvas reference
    }
  };

  const onGetSign = async () => {
    const today = new Date();

    const rect = pageCanvas?.getBoundingClientRect(); // Get the canvas' bounding box
    const top = signaturePosition.y - rect.y + 50;

    try {
      setOpen(false);
      setRequestSignLoading(true);
      const signData = await getSignPdfInfo({
        user_id: userId,
        serialNumber: certificates?.serial,
        dataDisplay: formData.content,
        document_base64: arrayBufferToBase64(pdfBuffer),
        contact: certificates?.name,
        reason: formData.reason,
        location: formData.location,
        signDate: today.getTime(),
        left: signaturePosition.x - rect.x,
        top: top,
        numberPageSign: signaturePosition.page,
      });
      if (signData?.objectError?.errorCode) {
        return enqueueSnackbar("Ký không thành công", {
          variant: "error",
        });
      }
      enqueueSnackbar("Ký thành công", {
        variant: "success",
      });
      const pdfBlob = base64ToBlob(
        `data:application/pdf;base64,${signData.signedFileBase64}`
      );

      // Save the file as a PDF
      const name = fileName || "examplePDF";
      saveAs(pdfBlob, name);
      return signData;
    } catch (error) {
      console.log("error", error);
    } finally {
      setRequestSignLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleOpen = () => {
    if (!signaturePosition) {
      return enqueueSnackbar("Vui lòng chọn vị trí ký", {
        variant: "error",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={requestSignLoading || loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tên file: {fileName}
          </Typography>
          <Button variant="contained" onClick={handleOpen}>
            Thêm chữ ký
          </Button>
        </Toolbar>
      </AppBar>
      <div
        style={{ marginTop: "64px", position: "relative", minHeight: "869px" }}
      >
        <Document file={fileSlice} onLoadSuccess={onDocumentLoadSuccess}>
          <div
            ref={pageRef}
            onClick={handlePageClick}
            style={{
              cursor: "crosshair",
              position: "relative",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              renderTextLayer={false} // Disables the text layer
              renderAnnotationLayer={false}
              onRenderSuccess={handleRenderSuccess}
            />
            {signaturePosition && signaturePosition.page === pageNumber && (
              <div
                alt="signature-preview"
                style={{
                  position: "absolute",
                  top: `${signaturePosition.y}px`,
                  left: `${signaturePosition.x}px`,
                  width: "200px",
                  height: "150px",
                  pointerEvents: "none", // Prevent interference with click events
                  border: "1px solid red", // For visibility of the signature boundary
                }}
              />
            )}
          </div>
        </Document>
      </div>
      <div>
        <Button
          variant="contained"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber(pageNumber - 1)}
        >
          Previous Page
        </Button>
        <Button
          sx={{ marginLeft: "16px" }}
          variant="contained"
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber(pageNumber + 1)}
        >
          Next Page
        </Button>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Nhập thông tin</DialogTitle>
        <DialogContent>
          <form onSubmit={onGetSign}>
            <TextField
              label="Nội dung"
              name="content"
              value={formData.content}
              onChange={handleChange}
              fullWidth
              margin="dense"
              variant="outlined"
            />
            <TextField
              label="Lý do"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              fullWidth
              margin="dense"
              variant="outlined"
            />
            <TextField
              label="Vị trí"
              name="location"
              value={formData.location}
              onChange={handleChange}
              fullWidth
              margin="dense"
              variant="outlined"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Huỷ
          </Button>
          <Button
            variant="contained"
            onClick={onGetSign}
            color="primary"
            type="submit"
          >
            Ký file
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PDFViewerWithSignature;
