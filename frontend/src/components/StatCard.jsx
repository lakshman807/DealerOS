function StatCard({ title, value, color, icon }) {
  return (
    <div className="stat-card">

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>

      <div
        className="stat-icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

    </div>
  );
}

export default StatCard;