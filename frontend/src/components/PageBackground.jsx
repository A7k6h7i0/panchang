import "./PageBackground.css";

const PageBackground = ({ children, className = "" }) => {
  return <div className={`page-background ${className}`.trim()}>{children}</div>;
};

export default PageBackground;
