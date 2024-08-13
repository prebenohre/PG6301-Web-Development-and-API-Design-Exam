import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useParams } from "react-router-dom";
import "./styles.css";

// ===========================
// Navbar Component
// ===========================
function Navbar({ user, onLogout }) {
	return (
		<nav className="navbar">
			<div className="navbar-brand">NewsApp 📰</div>
			<div className="navbar-menu">
				{user ? (
					<>
						<Link to="/profile" className="primary-button navbar-item">
							Profile
						</Link>
						<button onClick={onLogout} className="primary-button navbar-item">
							Logout
						</button>
					</>
				) : (
					<Link to="/login" className="primary-button navbar-item">
						Login
					</Link>
				)}
			</div>
		</nav>
	);
}

// ===========================
// Main Application Component
// ===========================
function App() {
	const [user, setUser] = useState(null);
	const [articles, setArticles] = useState([]);
	const wsRef = useRef(null);

	// Effect to check if the user is logged in on component mount
	useEffect(() => {
		fetch("/api/login")
			.then(response => {
				if (response.ok) {
					return response.json();
				} else {
					throw new Error("Failed to fetch user");
				}
			})
			.then(data => {
				if (data.name) {
					setUser(data.name);
				}
			})
			.catch(error => console.error("Error fetching user:", error));
	}, []);

	// Effect to set up and manage the WebSocket connection
	useEffect(() => {
		function connect() {
			wsRef.current = new WebSocket(
				`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
			);

			wsRef.current.onmessage = event => {
				const message = JSON.parse(event.data);
				switch (message.type) {
					case "newsAdded":
						setArticles(prevArticles => [...prevArticles, message.data]);
						break;
					case "newsUpdated":
						setArticles(prevArticles =>
							prevArticles.map(article =>
								article._id === message.data._id ? { ...article, ...message.data } : article
							)
						);
						break;
					case "newsDeleted":
						setArticles(prevArticles => prevArticles.filter(article => article._id !== message.data._id));
						break;
					default:
						break;
				}
			};

			wsRef.current.onclose = () => {
				console.log("WebSocket disconnected. Trying to reconnect...");
				setTimeout(connect, 3000);
			};

			wsRef.current.onerror = error => {
				console.error("WebSocket error:", error);
				wsRef.current.close();
			};
		}

		connect();

		return () => {
			if (wsRef.current) wsRef.current.close();
		};
	}, []);

	// Function to handle user logout
	const handleLogout = async () => {
		try {
			const response = await fetch("/api/logout", {
				method: "POST",
			});
			if (response.ok) {
				setUser(null);
			}
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	return (
		<Router>
			<div className="app">
				<Navbar user={user} onLogout={handleLogout} />
				<div className="content">
					<Routes>
						<Route
							path="/"
							element={<NewsList user={user} setUser={setUser} articles={articles} setArticles={setArticles} />}
						/>
						<Route path="/login" element={<Login setUser={setUser} />} />
						<Route path="/login/callback" element={<LoginCallback setUser={setUser} />} />
						<Route path="/newarticle" element={<AddNews user={user} />} />
						<Route path="/editarticle/:id" element={<EditNews user={user} />} />
						<Route path="/profile" element={<Profile user={user} />} />
						<Route path="*" element={<h1>404 Not Found</h1>} />
					</Routes>
				</div>
			</div>
		</Router>
	);
}

// ===========================
// Custom Hook: useLoader
// ===========================

// Custom hook to manage loading state, error state, and data fetching.
function useLoader(loadingFn) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState();
	const [data, setData] = useState();

	useEffect(() => {
		reload();
	}, []);

	async function reload() {
		setLoading(true);
		try {
			setData(await loadingFn());
		} catch (error) {
			setError(error);
		} finally {
			setLoading(false);
		}
	}

	return { loading, error, data, reload };
}

// ===========================
// LoginCallback Component
// ===========================

// Component to handle the OAuth callback from Google and log in the user.
function LoginCallback({ setUser }) {
	const navigate = useNavigate();

	useEffect(() => {
		const hashParams = new URLSearchParams(window.location.hash.substring(1));
		const accessToken = hashParams.get("access_token");
		console.log("Access Token: ", accessToken); // Logging access token for debugging

		if (accessToken) {
			(async () => {
				try {
					const response = await fetch("/api/login", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ access_token: accessToken }),
					});
					if (!response.ok) {
						throw new Error("Login failed");
					}
					const userResponse = await fetch("/api/login");
					if (!userResponse.ok) {
						throw new Error("Failed to fetch user info");
					}
					const data = await userResponse.json();
					console.log("User Info: ", data); // Logging user info for debugging
					setUser(data.name); // Set user name as the logged-in user's name
					navigate("/");
				} catch (error) {
					console.error("Error during login:", error);
				}
			})();
		}
	}, [navigate, setUser]);

	return <div>Please wait...</div>;
}

// ===========================
// Login Component
// ===========================

// Component to handle the user login via Google OAuth.
function Login() {
	const handleGoogleLogin = () => {
		const clientId = "748550571859-udd6k13djd9897ltj92ajaikp9tgoq2a.apps.googleusercontent.com"; // Google Client ID
		const redirectUri = `${window.location.origin}/login/callback`;
		const scope = "profile email";
		const responseType = "token";
		const state = "random_state_string"; // You can generate a random string for security

		const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}`;

		window.location.href = authUrl;
	};

	return (
		<div className="login-container">
			<div className="login-form">
				<h1>Welcome to NewsApp</h1>
				<button onClick={handleGoogleLogin} className="primary-button">
					Log in with Google
				</button>
			</div>
		</div>
	);
}

// ===========================
// NewsList Component
// ===========================

// Component to display the list of news articles and handle their addition, update, and deletion.
function NewsList({ user, articles, setArticles }) {
	const navigate = useNavigate();
	const { loading, error, reload } = useLoader(async () => {
		const response = await fetch("/api/news");
		if (!response.ok) throw new Error("Failed to fetch news articles");
		const data = await response.json();
		setArticles(data);
		return data;
	});

	const handleDeleteArticle = async id => {
		try {
			const response = await fetch(`/api/news/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error("Failed to delete news article");
			}
			// WebSocket will handle state update
		} catch (error) {
			console.error("Error deleting news article:", error);
		}
	};

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error loading news articles: {error.message}</div>;

	return (
		<div className="news-list-container">
			<div className="news-list-header">
				<h1>News Articles</h1>
				{user && (
					<button onClick={() => navigate("/newarticle")} className="primary-button full-width">
						Add Article
					</button>
				)}
			</div>
			<div className="news-container">
				{articles.length > 0 ? (
					articles.map(article => (
						<div key={article._id} className="news-item">
							<div className="news-header">
								<h2>{article.title}</h2>
								{user && article.author === user && (
									<div className="news-actions">
										<button onClick={() => navigate(`/editarticle/${article._id}`)} className="icon-button">
											✏️
										</button>
										<button onClick={() => handleDeleteArticle(article._id)} className="icon-button">
											❌
										</button>
									</div>
								)}
							</div>
							<p>{article.content}</p>
							<p>
								<em>Author: {article.author}</em>
							</p>
							<p>
								<em>
									Added at:{" "}
									{new Date(article.timestamp).toLocaleString(undefined, {
										year: "numeric",
										month: "numeric",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									}) || "Date not available"}
								</em>
							</p>
						</div>
					))
				) : (
					<p>No articles registered yet</p>
				)}
			</div>
		</div>
	);
}

// ===========================
// AddNews Component
// ===========================

// Component to handle adding a new news article.
function AddNews({ user }) {
	const navigate = useNavigate();
	const [newArticle, setNewArticle] = useState({ title: "", content: "" });

	const handleAddArticle = async () => {
		const articleWithTimestamp = { ...newArticle, timestamp: new Date().toISOString(), author: user };
		try {
			const response = await fetch("/api/news", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(articleWithTimestamp),
			});
			if (!response.ok) throw new Error("Failed to add news article");
			await response.json();
			navigate("/");
		} catch (error) {
			console.error("Error adding news article:", error);
		}
	};

	if (!user) {
		return (
			<div>
				<h1>Please log in to add news articles</h1>
				<button onClick={() => navigate("/login")} className="primary-button">
					Login
				</button>
			</div>
		);
	}

	return (
		<div className="add-news-container">
			<h1>Add News Article</h1>
			<input
				type="text"
				placeholder="Title"
				value={newArticle.title}
				onChange={e => setNewArticle({ ...newArticle, title: e.target.value })}
				className="article-input"
			/>
			<textarea
				placeholder="Content"
				value={newArticle.content}
				onChange={e => setNewArticle({ ...newArticle, content: e.target.value })}
				className="article-input"
			></textarea>
			<div className="add-news-buttons">
				<button onClick={handleAddArticle} className="primary-button">
					Add Article
				</button>
				<button onClick={() => navigate("/")} className="primary-button">
					Back
				</button>
			</div>
		</div>
	);
}

// ===========================
// EditNews Component
// ===========================

// Component to handle editing an existing news article.
function EditNews({ user }) {
	const navigate = useNavigate();
	const { id } = useParams();
	const {
		loading,
		error,
		data: article,
	} = useLoader(async () => {
		const response = await fetch(`/api/news/${id}`);
		if (!response.ok) throw new Error("Failed to fetch news article");
		return response.json();
	});

	const [editedArticle, setEditedArticle] = useState({ title: "", content: "" });

	useEffect(() => {
		if (article) {
			setEditedArticle({ title: article.title, content: article.content });
		}
	}, [article]);

	const handleEditArticle = async () => {
		try {
			const updatedArticle = { ...editedArticle, author: user, timestamp: article.timestamp };
			const response = await fetch(`/api/news/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedArticle),
			});
			if (!response.ok) {
				throw new Error("Failed to update news article");
			}
			await response.json();
			navigate("/");
		} catch (error) {
			console.error("Error updating news article:", error);
		}
	};

	if (!user) {
		return (
			<div>
				<h1>Please log in to edit news articles</h1>
				<button onClick={() => navigate("/login")} className="primary-button">
					Login
				</button>
			</div>
		);
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error loading news article: {error.message}</div>;

	return (
		<div className="edit-news-container">
			<h1>Edit News Article</h1>
			<input
				type="text"
				placeholder="Title"
				value={editedArticle.title}
				onChange={e => setEditedArticle({ ...editedArticle, title: e.target.value })}
				className="article-input"
			/>
			<textarea
				placeholder="Content"
				value={editedArticle.content}
				onChange={e => setEditedArticle({ ...editedArticle, content: e.target.value })}
				className="article-input"
			></textarea>
			<div className="add-news-buttons">
				<button onClick={handleEditArticle} className="primary-button">
					Update Article
				</button>
				<button onClick={() => navigate("/")} className="primary-button">
					Back
				</button>
			</div>
		</div>
	);
}

// ===========================
// Profile Component
// ===========================

// Component to display the user's profile information.
function Profile({ user }) {
	const navigate = useNavigate();
	const {
		loading,
		error,
		data: profile,
	} = useLoader(async () => {
		const response = await fetch("/api/login");
		if (!response.ok) throw new Error("Failed to fetch profile");
		return response.json();
	});

	if (!user) {
		return (
			<div>
				<h1>Please log in to view profile</h1>
				<button onClick={() => navigate("/login")} className="primary-button">
					Login
				</button>
			</div>
		);
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error loading profile: {error.message}</div>;

	return (
		<div className="profile-container">
			<h1>Profile Page</h1>
			{profile && (
				<div>
					<p>Name: {profile.name}</p>
					<p>Email: {profile.email}</p>
					<img src={profile.picture} alt="Profile" />
				</div>
			)}
			<button onClick={() => navigate("/")} className="primary-button">
				Back
			</button>
		</div>
	);
}

// Render the main App component to the DOM
ReactDOM.render(<App />, document.getElementById("root"));
