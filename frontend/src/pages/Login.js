import { Formik } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "../services/api.js";
import { setLogin } from "../redux/UserSlice";
import "../css/Login.css"; // Import your CSS file
import loginLogo from "../logos/loginLogo.png";

const initialRegisterValues = {
  name: "",
  email: "",
  password: "",
  avatar: "",
};

const initialLoginValues = {
  email: "",
  password: "",
};

const registerSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const [apiError, setApiError] = useState("");
  const [page, setPage] = useState("login");
  const [avatars, setAvatars] = useState([]);
  const isLogin = page === "login";
  const isRegister = page === "register";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch avatars from the backend
    axios
      .get("/public/avatars")
      .then((res) => {
        setAvatars(res.data.avatars);
      })
      .catch((error) => {
        console.error("Error fetching avatars:", error);
      });
  }, []);

  const handleLogin = (values, onSubmitProps) => {
    axios
      .post("/auth/login", values)
      .then((res) => {
        onSubmitProps.resetForm();
        dispatch(setLogin(res.data.user));
        navigate("/home");
      })
      .catch((error) => {
        setApiError(error.response?.data || "An unexpected error occurred");
        console.error(error);
      });
  };

  const handleRegister = (values, onSubmitProps) => {
    axios
      .post("/auth/register", values)
      .then((res) => {
        onSubmitProps.resetForm();
        setPage("login");
      })
      .catch((error) => {
        setApiError(
          error.response?.data?.message || "An unexpected error occurred"
        );
      });
  };

  const handleForm = (values, onSubmitProps) => {
    if (isLogin) handleLogin(values, onSubmitProps);
    if (isRegister) handleRegister(values, onSubmitProps);
  };

  return (
    <Formik
      initialValues={isLogin ? initialLoginValues : initialRegisterValues}
      validationSchema={isLogin ? loginSchema : registerSchema}
      onSubmit={handleForm}
    >
      {({
        handleSubmit,
        handleBlur,
        touched,
        setFieldValue,
        values,
        handleChange,
        resetForm,
        errors,
      }) => (
        <div className="login-page">
          <div className="form-container">
            <img src={loginLogo} className="logo"></img>
            <form onSubmit={handleSubmit} className="form">
              {isRegister && (
                <>
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Enter name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="form-input"
                    />
                    {touched.name && errors.name && (
                      <div className="form-error">{errors.name}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select avatar</label>
                    <div className="register-avatar-container">
                      {avatars.map((avatar) => (
                        <div
                          key={avatar}
                          className={`register-avatar-item ${
                            values.avatar === avatar ? "selected" : ""
                          }`}
                          onClick={() => setFieldValue("avatar", avatar)}
                        >
                          <img
                            src={`http://localhost:5000/public/avatars/${avatar}`}
                            alt={`Avatar ${avatar}`}
                            className="avatar-img"
                          />
                        </div>
                      ))}
                    </div>
                    {touched.avatar && errors.avatar && (
                      <div className="form-error">{errors.avatar}</div>
                    )}
                  </div>
                </>
              )}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Enter email
                </label>
                <input
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                />
                {touched.email && errors.email && (
                  <div className="form-error">{errors.email}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Enter password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                />
                {touched.password && errors.password && (
                  <div className="form-error">{errors.password}</div>
                )}
              </div>
              <button type="submit" className="button">
                {isLogin ? "Login" : "Register"}
              </button>
              <div
                onClick={() => {
                  setPage(isLogin ? "register" : "login");
                  setApiError("");
                  resetForm();
                }}
                className="switch-page"
              >
                {isLogin
                  ? "Not a user? Register here"
                  : "Already a user? Login here"}
              </div>
              {apiError && (
                <div
                  className="form-error api-error"
                  onClick={() => {
                    setApiError("");
                    resetForm();
                  }}
                >
                  {apiError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </Formik>
  );
};

export default Login;
