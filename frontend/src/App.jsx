import "./App.css";
import Hero from "./components/Hero/Hero";

function App() {
  return (
    <>
      <Hero />
      <footer>
        <p>
          Built with AWS, React & Node — by @{""}
          <a
            href="https://github.com/Gaurav-45"
            target="_blank"
            className="footer_link"
          >
            Gaurav Parulekar
          </a>
        </p>
      </footer>
    </>
  );
}

export default App;
