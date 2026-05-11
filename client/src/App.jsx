import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useApp } from './context/AppContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AuthModal from './components/ui/AuthModal'
import Home from './pages/Home'
import Explore from './pages/Explore'
import DocumentDetail from './pages/DocumentDetail'
import Library from './pages/Library'
import Checkout from './pages/Checkout'
import ClientDashboard from './pages/client/Dashboard'
import Profile from './pages/client/Profile'
import BecomeAuthor from './pages/client/BecomeAuthor'
import AuthorLayout from './pages/author/AuthorLayout'
import AuthorDashboard from './pages/author/Dashboard'
import MyDocuments from './pages/author/MyDocuments'
import UploadDocument from './pages/author/UploadDocument'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDocuments from './pages/admin/Documents'
import AdminCategories from './pages/admin/Categories'
import AdminAuthors from './pages/admin/Authors'
import Cart from './pages/Cart'
import Payment from './pages/Payment'
import MyOrders from './pages/client/Orders'
import Disputes from './pages/client/Disputes'
import { AdminOrders, AdminPromotions, AdminDisputes } from './pages/admin/NewAdminPages'
import AdminPredictions from './pages/admin/Predictions'

const MainLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
)

export default function App() {
  const { showAuth } = useApp()
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(18,18,31,0.95)',
            color: '#fff',
            border: '1px solid rgba(124,107,250,0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#7c6bfa', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      {showAuth && <AuthModal />}
      <Routes>
        {/* Public */}
        <Route path="/"           element={<MainLayout><Home /></MainLayout>} />
        <Route path="/explore"    element={<MainLayout><Explore /></MainLayout>} />
        <Route path="/explore/:category" element={<MainLayout><Explore /></MainLayout>} />
        <Route path="/doc/:id"    element={<MainLayout><DocumentDetail /></MainLayout>} />
        <Route path="/library"    element={<MainLayout><Library /></MainLayout>} />
        <Route path="/checkout"   element={<MainLayout><Checkout /></MainLayout>} />
        {/* Client */}
        <Route path="/dashboard"     element={<MainLayout><ClientDashboard /></MainLayout>} />
        <Route path="/profile"       element={<MainLayout><Profile /></MainLayout>} />
        <Route path="/become-author" element={<MainLayout><BecomeAuthor /></MainLayout>} />
        <Route path="/cart"          element={<MainLayout><Cart /></MainLayout>} />
        <Route path="/payment"       element={<Payment />} />
        <Route path="/orders"        element={<MainLayout><MyOrders /></MainLayout>} />
        <Route path="/disputes"      element={<MainLayout><Disputes /></MainLayout>} />
        {/* Author */}
        <Route path="/author" element={<AuthorLayout />}>
          <Route index            element={<AuthorDashboard />} />
          <Route path="documents" element={<MyDocuments />} />
          <Route path="upload"    element={<UploadDocument />} />
        </Route>
        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index              element={<AdminDashboard />} />
          <Route path="users"       element={<AdminUsers />} />
          <Route path="documents"   element={<AdminDocuments />} />
          <Route path="categories"  element={<AdminCategories />} />
          <Route path="authors"     element={<AdminAuthors />} />
          <Route path="orders"      element={<AdminOrders />} />
          <Route path="promotions"  element={<AdminPromotions />} />
          <Route path="disputes"    element={<AdminDisputes />} />
          <Route path="predictions" element={<AdminPredictions />} />
        </Route>
      </Routes>
    </>
  )
}
