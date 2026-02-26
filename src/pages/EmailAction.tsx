import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export const  EmailAction= () =>  {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    const token = searchParams.get("token");
    const status = searchParams.get("status");

    axios.post("http://localhost:5053/api/leave/email-review", {
      token,
      status,
    })
    .then(res => {
      setMessage("✅ Leave " + status + " Successfully");
    })
    .catch(err => {
      setMessage("❌ " + err.response?.data || "Something went wrong");
    });

  }, []);

  return (
    <div style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      height:"100vh",
      fontFamily:"Segoe UI"
    }}>
      <div style={{
        background:"white",
        padding:"40px",
        borderRadius:"10px",
        boxShadow:"0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <h2>{message}</h2>
      </div>
    </div>
  );
}