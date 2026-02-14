import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {

         await fetch('{{baseUrl}}/auth/forgot-password', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email })
       });
      
      setTimeout(() => {
        setSubmitted(true);
        toast.success("Password reset link sent to your email!");
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error("Failed to send reset link. Please try again.");
      setLoading(false);
    }
  };