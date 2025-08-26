"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../context/auth-context";
import { SignInButton } from "@clerk/nextjs";
import { FcGoogle } from "react-icons/fc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nomError, setNomError] = useState("");
  const [prenomError, setPrenomError] = useState("");
  const [nationaliteError, setNationaliteError] = useState("");
  const [ageError, setAgeError] = useState("");
  const [sexeError, setSexeError] = useState("");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nationalite, setNationalite] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [sexe, setSexe] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const toggleAuthMode = () => setIsLogin(!isLogin);

  const validateForm = () => {
    let isValid = true;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Format d'email invalide");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!isLogin) {
      // Validate name
      if (!nom || nom.length < 2) {
        setNomError("Le nom doit contenir au moins 2 caractères");
        isValid = false;
      } else {
        setNomError("");
      }

      // Validate surname
      if (!prenom || prenom.length < 2) {
        setPrenomError("Le prénom doit contenir au moins 2 caractères");
        isValid = false;
      } else {
        setPrenomError("");
      }

      // Validate nationality
      if (!nationalite || nationalite.length < 2) {
        setNationaliteError("La nationalité est requise");
        isValid = false;
      } else {
        setNationaliteError("");
      }

      // Validate age
      if (!age || age < 13 || age > 120) {
        setAgeError("L'âge doit être compris entre 13 et 120 ans");
        isValid = false;
      } else {
        setAgeError("");
      }

      // Validate gender
      if (!sexe || !['Homme', 'Femme', 'Autre'].includes(sexe)) {
        setSexeError("Sélection de sexe invalide");
        isValid = false;
      } else {
        setSexeError("");
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const accessToken = ""; // Placeholder for access token
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          rememberMe,
          nom: isLogin ? undefined : nom,
          prenom: isLogin ? undefined : prenom,
          nationalite: isLogin ? undefined : nationalite,
          age: isLogin ? undefined : age,
          sexe: isLogin ? undefined : sexe,
          isLogin
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Succès",
          description: isLogin
            ? "Connexion réussie"
            : "Inscription réussie",
        });
        if (data.token) {
          login(data.token); // Pass only the token to login
        }
        setIsOpen(false);
      } else {
        throw new Error(data.message || "Erreur d'authentification");
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Erreur",
        description: error instanceof Error
          ? error.message
          : "Une erreur est survenue. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)}>
        {isLogin ? "Connexion" : "Inscription"}
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLogin ? "Connexion" : "Inscription"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
            />
            {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Validate password strength
                const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(e.target.value)) {
                  setPasswordError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
                } else {
                  setPasswordError("");
                }
              }}
            />
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              required={!isLogin}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  type="text"
                  required={!isLogin}
                  value={nom}
                  onChange={(e) => {
                    setNom(e.target.value);
                    setNomError("");
                  }}
                />
                {nomError && <p className="text-sm text-red-500">{nomError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  type="text"
                  required={!isLogin}
                  value={prenom}
                  onChange={(e) => {
                    setPrenom(e.target.value);
                    setPrenomError("");
                  }}
                />
                {prenomError && <p className="text-sm text-red-500">{prenomError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalite">Nationalité</Label>
                <Input
                  id="nationalite"
                  type="text"
                  required={!isLogin}
                  value={nationalite}
                  onChange={(e) => {
                    setNationalite(e.target.value);
                    setNationaliteError("");
                  }}
                />
                {nationaliteError && <p className="text-sm text-red-500">{nationaliteError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  required={!isLogin}
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value ? parseInt(e.target.value) : "");
                    setAgeError("");
                  }}
                />
                {ageError && <p className="text-sm text-red-500">{ageError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexe">Sexe</Label>
                <select
                  id="sexe"
                  required={!isLogin}
                  value={sexe}
                  onChange={(e) => {
                    setSexe(e.target.value);
                    setSexeError("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sexeError && <p className="text-sm text-red-500">{sexeError}</p>}
                  <option value="">Sélectionner</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="rememberMe" className="text-sm">
              Remember me
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? "Connexion..." : "Inscription..."}
              </div>
            ) : (
              isLogin ? "Se connecter" : "S'inscrire"
            )}
          </Button>
          <div className="flex justify-center mt-4">
            <SignInButton mode="modal">
              <Button className="text-white w-full mt-2">
                <FcGoogle className="inline mr-2" />
                Se connecter
              </Button>
            </SignInButton>
          </div>
          <Button
            variant="link"
            onClick={toggleAuthMode}
            className="w-full"
          >
            {isLogin
              ? "Pas de compte ? Inscrivez-vous"
              : "Déjà un compte ? Connectez-vous"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
