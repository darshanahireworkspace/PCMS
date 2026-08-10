import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Phone,
  User,
  MapPin,
  Search,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getPoliceStations,
  createPoliceStation,
  deletePoliceStation,
} from "../api/policeStationApi";

import { addToOfflineQueue } from "../services/offlineQueue";

function PoliceStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    station_name: "",
    station_code: "",
    city: "",
    district: "",
    state: "",
    contact_number: "",
    station_head: "",
    address: "",
  });

  const loadStations = async () => {
    try {
      setLoading(true);

      const res = await getPoliceStations();

      setStations(res.data.data || []);
    } catch {
      toast.error("Failed to load police stations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await createPoliceStation(form);

      toast.success("Police Station Added");

      setShowForm(false);

      setForm({
        station_name: "",
        station_code: "",
        city: "",
        district: "",
        state: "",
        contact_number: "",
        station_head: "",
        address: "",
      });

      loadStations();
    } catch (error) {
      if (!navigator.onLine) {
        await addToOfflineQueue({
          method: "POST",
          url: "/police-stations",
          data: form,
        });

        toast.success("Saved offline. It will sync when internet returns.");
        return;
      }

      toast.error(
        error.response?.data?.message || "Failed to add station"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Police Station?")) return;

    try {
      await deletePoliceStation(id);

      toast.success("Deleted Successfully");

      loadStations();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>

      <div className="page-header">

        <div>

          <h2 className="page-title">
            Police Station Master
          </h2>

          <p className="page-subtitle">
            Master list of police stations.
          </p>

        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          Add Police Station
        </button>

      </div>

      {showForm && (

        <form
          className="enterprise-form"
          onSubmit={handleSave}
        >

          <div className="form-grid">

            <div className="form-group">
              <label>Station Name</label>

              <input
                name="station_name"
                value={form.station_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Station Code</label>

              <input
                name="station_code"
                value={form.station_code}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>City</label>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>District</label>

              <input
                name="district"
                value={form.district}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>State</label>

              <input
                name="state"
                value={form.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>

              <input
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Station Head</label>

              <input
                name="station_head"
                value={form.station_head}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

          </div>

          <button className="primary-btn">
            Save Police Station
          </button>

        </form>

      )}

      <div className="data-table-card">

        {loading ? (

          <p>Loading...</p>

        ) : (

          <table className="professional-table">

            <thead>

              <tr>

                <th>Station</th>

                <th>Code</th>

                <th>Head</th>

                <th>Phone</th>

                <th>City</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {stations.map((station) => (

                <tr key={station.id}>

                  <td>

                    <div className="place-cell">

                      <div className="place-icon">

                        <Building2 size={18} />

                      </div>

                      <div>

                        <b>{station.station_name}</b>

                        <p>{station.address}</p>

                      </div>

                    </div>

                  </td>

                  <td>

                    {station.station_code}

                  </td>

                  <td>

                    <User size={15} />

                    {" "}

                    {station.station_head}

                  </td>

                  <td>

                    <Phone size={15} />

                    {" "}

                    {station.contact_number}

                  </td>

                  <td>

                    <MapPin size={15} />

                    {" "}

                    {station.city}

                  </td>

                  <td>

                    <button
                      className="danger-action"
                      onClick={() =>
                        handleDelete(station.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

export default PoliceStations;