function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__brand">
        <div className="loading-screen__logo">ATHRON AI</div>
        <p>Your Personal AI Fitness Coach</p>
      </div>
      <div className="loading-screen__loader">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default LoadingScreen;
