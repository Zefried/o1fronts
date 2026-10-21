import { useNavigate } from 'react-router-dom';
import './Styles/AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();

  const stats = [
    { title: "Total Restaurants", value: 125 },
    { title: "Total Districts", value: 8 },
    { title: "Active Restaurants", value: 110 },
    { title: "Inactive Restaurants", value: 15 },
  ];

  const restaurants = [
    {
      id: "RST001",
      name: "ABC Cafe",
      state: "Jorhat",
      branches: 3,
      status: "Active",
    },
    {
      id: "RST002",
      name: "XYZ Bistro",
      state: "Guwahati",
      branches: 2,
      status: "Inactive",
    },
    {
      id: "RST003",
      name: "Food Hub",
      state: "Guwahati",
      branches: 1,
      status: "Active",
    },
    {
      id: "RST004",
      name: "Spice Kitchen",
      state: "Nogaon",
      branches: 4,
      status: "Active",
    },
    {
      id: "RST005",
      name: "Urban Bites",
      state: "Mirza",
      branches: 2,
      status: "Inactive",
    },
  ];

  return (
    <div className="adp">
      
      {/* Top Cards */}
      <div className="adp__cards">
        {stats.map((item, index) => (
          <div key={index} className="adp__card">
            <p className="adp__card-title">{item.title}</p>
            <h2 className="adp__card-value">{item.value}</h2>
          </div>
        ))}
      </div>

      {/* Restaurants Section */}
      <div className="adp__orders">
        <div className="links">
          <h3 className="adp__section-title">Recent Restaurants</h3>

          <h4
            className="adp-view-all-link"
            onClick={() => navigate('/dashboard/businesses')}
          >
            View All Businesses →
          </h4>
        </div>

        <div className="adp-table-wrapper">
          <table className="adp-table">
            <thead>
              <tr>
                <th>Restaurant ID</th>
                <th>Restaurant Name</th>
                <th>Location</th>
                <th>Branches</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td className="adp-id">{restaurant.id}</td>
                  <td>{restaurant.name}</td>
                  <td>{restaurant.state}</td>
                  <td>{restaurant.branches}</td>

                  <td>
                    <span
                      className={`adp-status ${restaurant.status.toLowerCase()}`}
                    >
                      {restaurant.status}
                    </span>
                  </td>

                  <td>
                    <button className="adp-view-btn">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;