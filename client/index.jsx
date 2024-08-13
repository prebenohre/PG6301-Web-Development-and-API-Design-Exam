import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useParams } from "react-router-dom";
import "./styles.css";

// Article categories
const categories = ["Choose category...", "Politics", "Economy", "Technology", "Science", "Culture"];

// ===========================
// Navbar Component
// ===========================
function Navbar({ user, onLogout }) {
	const navigate = useNavigate();

	return (
		<nav className="navbar">
			<div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
				NewsApp 📰
			</div>
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
						<Route path="/" element={<NewsList user={user} articles={articles} setArticles={setArticles} />} />
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
function LoginCallback({ setUser }) {
	const navigate = useNavigate();

	useEffect(() => {
		const hashParams = new URLSearchParams(window.location.hash.substring(1));
		const accessToken = hashParams.get("access_token");
		console.log("Access Token: ", accessToken);

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
					console.log("User Info: ", data);
					setUser(data.name);
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
function Login() {
	const navigate = useNavigate();

	const handleGoogleLogin = () => {
		const clientId = "748550571859-udd6k13djd9897ltj92ajaikp9tgoq2a.apps.googleusercontent.com";
		const redirectUri = `${window.location.origin}/login/callback`;
		const scope = "profile email";
		const responseType = "token";
		const state = "random_state_string";

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
				<div className="login-separator">
					<span>or...</span>
				</div>
				<button onClick={() => navigate("/")} className="secondary-button">
					Continue as an anonymous user
				</button>
			</div>
		</div>
	);
}

// ===========================
// NewsList Component
// ===========================
function NewsList({ user, articles, setArticles }) {
	const navigate = useNavigate();
	const [expandedArticles, setExpandedArticles] = useState({});
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

	const toggleArticle = id => {
		setExpandedArticles(prev => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error loading news articles: {error.message}</div>;

	// Sorter artiklene slik at de nyeste vises først
	const sortedArticles = [...articles].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
				{sortedArticles.length > 0 ? (
					sortedArticles.map(article => (
						<div key={article._id} className="news-item">
							<div className="news-header" onClick={() => toggleArticle(article._id)}>
								<h2>{article.title}</h2>
								{user && article.author === user && (
									<div className="news-actions">
										<button
											onClick={e => {
												e.stopPropagation();
												navigate(`/editarticle/${article._id}`);
											}}
											className="icon-button"
										>
											✏️
										</button>
										<button
											onClick={e => {
												e.stopPropagation();
												handleDeleteArticle(article._id);
											}}
											className="icon-button"
										>
											❌
										</button>
									</div>
								)}
							</div>
							<div className="expand-collapse-hint" onClick={() => toggleArticle(article._id)}>
								{expandedArticles[article._id] ? "Click to collapse article" : "Click to read full article"}
							</div>
							{expandedArticles[article._id] && (
								<div className="news-content">
									<p style={{ whiteSpace: "pre-wrap" }}>{article.content}</p>
									<p>
										<em>Category: {article.category}</em>
									</p>
									<div className="author-info">
										<span>Author: {article.author}</span>
										{article.authorPicture && (
											<img src={article.authorPicture} alt="Author" className="author-picture" />
										)}
									</div>
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
							)}
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
function AddNews({ user }) {
	const navigate = useNavigate();
	const [newArticle, setNewArticle] = useState({ title: "", content: "", category: "" });

	const handleAddArticle = async () => {
		if (!newArticle.title.trim() || !newArticle.content.trim() || !newArticle.category) {
			alert("You need to fill in all fields, including selecting a category");
			return;
		}

		const articleWithTimestamp = {
			...newArticle,
			content: newArticle.content.trim(), // Trim content
			timestamp: new Date().toISOString(),
			author: user,
		};
		try {
			const response = await fetch("/api/news", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(articleWithTimestamp),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to add news article");
			}
			await response.json();
			navigate("/");
		} catch (error) {
			console.error("Error adding news article:", error);
			alert(error.message);
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
			<select
				value={newArticle.category}
				onChange={e => setNewArticle({ ...newArticle, category: e.target.value })}
				className="article-input"
			>
				{categories.map((category, index) => (
					<option key={category} value={index === 0 ? "" : category} disabled={index === 0}>
						{category}
					</option>
				))}
			</select>
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

	const [editedArticle, setEditedArticle] = useState({
		title: "",
		content: "",
		category: "",
	});

	useEffect(() => {
		if (article) {
			setEditedArticle({
				title: article.title,
				content: article.content,
				category: article.category || "",
			});
		}
	}, [article]);

	const handleEditArticle = async () => {
		if (!editedArticle.title.trim() || !editedArticle.content.trim() || !editedArticle.category) {
			alert("You need to fill in all fields, including selecting a category");
			return;
		}

		try {
			const updatedArticle = {
				...editedArticle,
				content: editedArticle.content.trim(), // Trim content
				author: user,
				timestamp: article.timestamp,
			};
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
			<select
				value={editedArticle.category}
				onChange={e => setEditedArticle({ ...editedArticle, category: e.target.value })}
				className="article-input"
			>
				{categories.map((category, index) => (
					<option key={category} value={index === 0 ? "" : category} disabled={index === 0}>
						{category}
					</option>
				))}
			</select>
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
				<div className="profile-info">
					{profile.picture && <img src={profile.picture} alt="Profile" className="profile-picture" />}
					<p>
						<strong>Name:</strong> {profile.name}
					</p>
					<p>
						<strong>Email:</strong> {profile.email}
					</p>
				</div>
			)}
			<button onClick={() => navigate("/")} className="primary-button full-width">
				Back
			</button>
		</div>
	);
}

// Render the main App component to the DOM
ReactDOM.render(<App />, document.getElementById("root"));
