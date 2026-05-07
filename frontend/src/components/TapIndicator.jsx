import "./TapIndicator.css";

const TapIndicator = () => {
  return (
    <div className="tap-container" aria-hidden="true">
      <span className="tap-arc tap-arc-1" />
      <span className="tap-arc tap-arc-2" />
      <span className="tap-arc tap-arc-3" />
      <img className="hand" src="/Hand%20Pointer.png" alt="" />
    </div>
  );
};

export default TapIndicator;
