import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import axios from "axios";
import { toPng } from "html-to-image";
import { toast } from "react-toastify";
import "./Hero.css";

const apiUrl = import.meta.env.VITE_BACKEND_URL;

const Hero = () => {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [shortUrl, setShortUrl] = useState(apiUrl);
  const [isLoading, setIsLoading] = useState(false);
  const imageRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a URL to shorten");
      return;
    }

    setIsLoading(true);
    toast.success("Processing your URL...");

    axios
      .post(`${apiUrl}/create`, {
        longURL: url,
        expiryInDays: 30,
        ...(customAlias ? { customAlias } : {}),
      })
      .then((response) => {
        setShortCode(response.data.shortCode);
        setShortUrl(response.data.shortURL);
        setIsLoading(false);
        toast.success("URL Proccessed successfully!");
      })
      .catch((error) => {
        console.error("Error shortening URL:", error);
        setIsLoading(false);
        toast.error(error.response.data.message || "Error shortening URL");
      });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Short URL copied to clipboard!");
  };

  const handleRedirect = () => {
    window.open(shortUrl, "_blank");
  };

  const downloadQR = () => {
    toPng(imageRef.current, { cacheBust: false })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `QR-${shortCode}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="hero_container">
      <div className="left_container">
        <div className="url_input_container">
          <div className="title_container">
            <h1>Shrinkr</h1>
            <p>Shorten your long URLs with just one click</p>
          </div>
          <form className="url_container" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter your URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
            />
            <button
              className="yellow_button shorten_button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="button-text">Processing</span>
                  <span className="loading-dots">...</span>
                </>
              ) : (
                "SHORTEN"
              )}
            </button>
          </form>
        </div>

        {/* {shortCode && (
          <div className="short_url_card">
            <div className="short_url_top">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                {shortCode}
              </a>
              <div className="icon_buttons">
                <button onClick={handleCopy} title="Copy">
                  📋
                </button>
                <button onClick={handleRedirect} title="Open">
                  🔗
                </button>
              </div>
            </div>
            <p className="short_url_note">
              Click on the link to open in a new tab or use the copy button
            </p>
          </div>
        )} */}
      </div>

      <div className="right_container">
        {shortUrl && (
          <>
            <div className="qr_code_container">
              <QRCode
                value={shortUrl}
                size={256}
                style={{
                  height: "auto",
                  maxWidth: "100%",
                  width: "100%",
                  marginBottom: "20px",
                }}
                ref={imageRef}
              />
              <button className="yellow_button" onClick={downloadQR}>
                Donwload QR
              </button>
            </div>
            <div className="short_url_card">
              <div className="short_url_top">
                <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                  {shortCode}
                </a>
                <div className="icon_buttons">
                  <button onClick={handleCopy} title="Copy">
                    📋
                  </button>
                  <button onClick={handleRedirect} title="Open">
                    🔗
                  </button>
                </div>
              </div>
              <p className="short_url_note">
                Click on the link to open in a new tab or use the copy button
              </p>
            </div>
            {shortCode.length == 0 && (
              <div className="qr_blur_overlay">
                <button className="yellow_button">
                  Add url and submit to view
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Hero;
