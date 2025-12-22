# Shopify Store App

A React Native mobile application for the Sapreet-dev Shopify store. This app allows users to browse products, manage their cart, and complete purchases via a secure checkout process.

## 📱 Features

- **Product Catalog**: Browse a list of available products.
- **Product Details**: View detailed information about specific products.
- **Shopping Cart**: Add items to cart and manage quantities.
- **Checkout**: Seamless checkout experience using an integrated WebView.
- **User Accounts**:
  - Login and Registration functionality.
  - Persistent authentication using Async Storage.
- **Navigation**: Intuitive bottom tab navigation combined with stack navigation for deeper flows.

> **Note:** Ensure this URL is active and reachable. If you are running a local backend, update this URL to point to your local server (e.g., `http://10.0.2.2:PORT` for Android emulator).

## 📂 Project Structure

```
src/
├── api/             # API service calls (Products, Cart, Customer)
├── context/         # React Context (AuthContext for user state)
├── navigation/      # Navigation configuration (Tabs, Stacks)
├── screens/         # App screens (Products, Cart, Login, etc.)
└── ...
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
