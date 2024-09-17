import React, { useState, useEffect, useRef, useMemo } from "react";
import { Document, Page } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { pdfjs } from "react-pdf";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import useMousePosition from "./hook/useMousePosition";
import { Worker, Viewer } from "@react-pdf-viewer/core";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const useStyles = makeStyles(() => ({
  page: {
    width: "fit-content",
  },
  pdfDocument: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "gray",
  },
}));

const PdfSignatureFromDrive = () => {
  const classes = useStyles();
  const [loading, setloading] = useState(false);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [openDraw, setOpenDraw] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For loading state

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const signatureBase64 = `data:image/png;base64,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`;
  // https://drive.google.com/file/d/1dvpsnESPmLb-6rGEab1uFKhQnegD4uWg/view?usp=sharing

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const nextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber((prevPageNumber) => prevPageNumber + 1);
    }
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      setPageNumber((prevPageNumber) => prevPageNumber - 1);
    }
  };

  const fetchPdf = async () => {
    const proxyUrl = "http://localhost:3001/download-pdf";

    try {
      const response = await fetch(
        proxyUrl +
          "?" +
          new URLSearchParams({
            fileId: "1dvpsnESPmLb-6rGEab1uFKhQnegD4uWg",
          }).toString()
      );
      if (!response.ok) {
        throw new Error(`Error fetching the PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      setPdfBytes(arrayBuffer);
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };
  useEffect(() => {
    // Fetch PDF from Google Drive

    fetchPdf();
  }, []);

  const addSignatureToPdf = async () => {
    if (!pdfBytes || !signaturePosition) return;

    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Decode the base64 signature
    // const signatureImageBytes = Uint8Array.from(atob(signatureBase64), (c) =>
    //   c.charCodeAt(0)
    // );

    // Embed the signature image into the PDF
    const signatureImage = await pdfDoc.embedPng(signatureBase64);

    // Define the size of the signature image
    const imageWidth = 150;
    const imageHeight =
      (signatureImage.height / signatureImage.width) * imageWidth;

    // Draw the image on the selected position
    firstPage.drawImage(signatureImage, {
      x: signaturePosition.x,
      y: firstPage.getHeight() - signaturePosition.y - imageHeight, // Convert canvas to PDF coordinates
      width: imageWidth,
      height: imageHeight,
    });

    // Save the modified PDF and return the bytes
    const modifiedPdfBytes = await pdfDoc.save();

    // Use file-saver to download the modified PDF
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
    saveAs(blob, "signed_document.pdf");
  };

  const fileSlice = useMemo(() => pdfBytes?.slice(0), [pdfBytes]);

  return (
    <div>
      <Box style={{ width: "100%", border: "1px solid #ccc" }} sx={{}}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Render PDF
            </Typography>
            <Box>
              <Button onClick={addSignatureToPdf} color="inherit">
                Thêm chữ ký
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Box>
          <Document
            file={fileSlice}
            onLoadSuccess={onDocumentLoadSuccess}
            options={{ workerSrc: pdfjs.GlobalWorkerOptions.workerSrc }}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <Button
              variant="outlined"
              onClick={previousPage}
              disabled={pageNumber <= 1}
            >
              Previous
            </Button>
            <span style={{ margin: "0 15px" }}>
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outlined"
              onClick={nextPage}
              disabled={pageNumber >= numPages}
            >
              Next
            </Button>
          </div>
        </Box>
      </Box>
    </div>
  );
};

export default PdfSignatureFromDrive;
