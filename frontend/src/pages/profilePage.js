import React, { useState, useEffect } from "react";
import axios from "../services/api.js";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../redux/UserSlice"; // Assuming you have a Redux slice for user updates
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import Header from "./Header.js";
import "../css/profilePage.css";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [avatars, setAvatars] = useState([]);

  const [newAvatar, setNewAvatar] = useState(user.avatar);
  const [newName, setNewName] = useState(user.name);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const openAvatarDialog = () => {
    setError("");
    setIsAvatarDialogOpen(true);
  };
  const closeAvatarDialog = () => setIsAvatarDialogOpen(false);

  const openNameDialog = () => {
    setError("");
    setIsNameDialogOpen(true);
  };
  const closeNameDialog = () => setIsNameDialogOpen(false);

  const openPasswordDialog = () => {
    setError("");
    setIsPasswordDialogOpen(true);
  };
  const closePasswordDialog = () => setIsPasswordDialogOpen(false);

  const handleNameChange = (e) => setNewName(e.target.value);
  const handlePasswordChange = (e) => setNewPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  useEffect(() => {
    axios
      .get("/public/avatars")
      .then((res) => {
        setAvatars(res.data.avatars);
      })
      .catch((error) => {
        console.error("Error fetching avatars:", error);
      });
  }, []);

  const handleSaveAvatar = async () => {
    try {
      const response = await axios.put(`/auth/update`, {
        newAvatar: newAvatar,
      });
      alert(`Avatar changed!`);
      dispatch(updateUser(response.data.updatedUser));
      closeAvatarDialog();
    } catch (error) {
      setError(error.response.data);
    }
  };

  const handleSaveName = async () => {
    try {
      const response = await axios.put(`/auth/update`, { newName: newName });
      alert(`Username changed to ${newName}`);
      dispatch(updateUser(response.data.updatedUser));
      closeNameDialog();
    } catch (error) {
      setError(error.response.data);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await axios.put(`/auth/update`, {
        newPassword: newPassword,
      });
      alert(`Password updated!`);
      dispatch(updateUser(response.data.updatedUser));
      closePasswordDialog();
    } catch (error) {
      setError(error.response.data);
    }
  };

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-avatar-container">
            <img
              src={`http://localhost:5000/public/avatars/${user.avatar}`}
              alt={user.name}
              className="profile-avatar"
            />
            <div
              className="avatar-edit-icon"
              title="Change Avatar"
              onClick={openAvatarDialog}
            >
              <FontAwesomeIcon icon={faUserCircle} />
            </div>
          </div>
          <h2>
            {user.name}
            <FontAwesomeIcon
              icon={faPen}
              className="name-edit-icon"
              onClick={openNameDialog}
              title="Change Name"
            />
          </h2>
          <p>{user.email}</p>
          <p className="reset-password" onClick={openPasswordDialog}>
            Reset password?
          </p>
        </div>

        {isAvatarDialogOpen && (
          <div className="dialog-overlay">
            <div className="dialog-box">
              <h3>Change Avatar</h3>
              {error && <div className="error-message">{error}</div>}
              <div className="avatar-container">
                {avatars.map((avatar) => (
                  <div
                    key={avatar}
                    className={`avatar-item ${
                      newAvatar === avatar ? "selected" : ""
                    }`}
                    onClick={() => setNewAvatar(avatar)}
                  >
                    <img
                      src={`http://localhost:5000/public/avatars/${avatar}`}
                      alt={`Avatar ${avatar}`}
                      className="avatar-img"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveAvatar}>Save</button>
              <button onClick={closeAvatarDialog}>Cancel</button>
            </div>
          </div>
        )}

        {isNameDialogOpen && (
          <div className="dialog-overlay">
            <div className="dialog-box">
              <h3>Change Name</h3>
              {error && <div className="error-message">{error}</div>}
              <input
                type="text"
                value={newName}
                onChange={handleNameChange}
                placeholder="New Name"
              />
              <button onClick={handleSaveName}>Save</button>
              <button onClick={closeNameDialog}>Cancel</button>
            </div>
          </div>
        )}

        {isPasswordDialogOpen && (
          <div className="dialog-overlay">
            <div className="dialog-box">
              <h3>Reset Password</h3>
              {error && <div className="error-message">{error}</div>}
              <input
                type="password"
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="New Password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm Password"
              />
              <button onClick={handleSavePassword}>Save</button>
              <button onClick={closePasswordDialog}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;
