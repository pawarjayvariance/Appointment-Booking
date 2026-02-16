import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DoctorProfilePopover from "../Organisms/DoctorProfilePopover";
import { useAuth } from "../../context/AuthContext";
import "./DoctorNav.css";

const DoctorNav = ({
  selectedDoctor,
  onPrev,
  onNext,
  onSwitchToAll,
  isAllDoctors,
  hasDoctors,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const isPatient = user?.role === 'user';

  if (!hasDoctors) return null;

  return (
    <div className="doctor-info">
      <div className="doctor-nav">
        <button onClick={onPrev} className="nav-btn" title="Previous Doctor">
          <ChevronLeft size={24} />
        </button>

        <div className="doctor-profile-container">
          <div
            className={`doctor-avatar-circle ${isAllDoctors ? "all-doctors" : ""}`}
            onClick={() => !isAllDoctors && setIsPopoverOpen(true)}
            style={{ cursor: isAllDoctors ? 'default' : 'pointer' }}
          >
            {isAllDoctors ? (
              <User size={40} />
            ) : selectedDoctor.user?.profilePic ? (
              <img
                src={selectedDoctor.user.profilePic}
                alt={selectedDoctor.name}
              />
            ) : (
              <User size={40} />
            )}
          </div>

          <h4 className="doctor-name-display">
            {isAllDoctors ? "All Specializations" : selectedDoctor.name}
          </h4>

          {isAllDoctors ? (
            <span className="doctor-specialization-tag">
              Collective Schedule
            </span>
          ) : (
            <>
              <span className="doctor-specialization-tag">
                {selectedDoctor.specialization}
              </span>
              <div className="doctor-tz-info">
                <Globe size={14} /> {selectedDoctor.timezone}
              </div>
            </>
          )}

          {!isAllDoctors && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
              {isPatient && (
                <button
                  onClick={() => navigate(`/doctor/${selectedDoctor.id}`)}
                  className="view-profile-btn"
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--primary)',
                    background: 'white',
                    color: 'var(--primary)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View Full Profile
                </button>
              )}
              <button onClick={onSwitchToAll} className="switch-btn">
                View All Doctors Schedule
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="nav-btn"
          title={isAllDoctors ? "View Specific Doctor" : "Next Doctor"}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {!isAllDoctors && selectedDoctor && (
        <DoctorProfilePopover
          doctor={selectedDoctor}
          isOpen={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
          token={token}
        />
      )}
    </div>
  );
};


export default DoctorNav;
