import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X } from 'lucide-react'

const Layout = () => {

  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)

  return (
    <div className='flex flex-col item-start justify-start h-screen'>
      <nav>
        <img src={assets.logofinal} alt=" " onClick={()=>navigate('/')} />
        {
          sidebar?<X className='w-6 h-6 text-gray-600 sm:hidden' />
          : <Menu className='w-6 h-6 text-gray-600 sm:hidden'/>
        }
      </nav>
      <Outlet />      
    </div>
  )
}

export default Layout


// The Outlet component in react-router-dom is a crucial element for rendering nested routes and managing layouts within your React application. It acts as a placeholder where child routes of a parent route will be rendered.

// Key functions of Outlet:
// Nested Route Rendering: When you define a parent route with child routes, the Outlet component within the parent's element determines where those child routes will be displayed.

// Layout Management: Outlet facilitates the creation of shared layouts. You can define a layout component (e.g., a header, sidebar, and footer) and place an Outlet within it. Then, all child routes of that layout will render their specific content within the Outlet, while sharing the common layout elements.

// Dynamic Content Display: It dynamically renders the content of the matching child route based on the current URL. If no child route matches, Outlet renders nothing.