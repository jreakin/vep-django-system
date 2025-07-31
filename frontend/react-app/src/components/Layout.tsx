import React from 'react'
import type { ReactNode } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  AccountBalance as BillingIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { logout } from '../store/authSlice'
import NotificationCenter from './NotificationCenter'

const drawerWidth = 240

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
    { text: 'Voter Data', icon: <PeopleIcon />, path: '/voter-data' },
    { text: 'Canvassing', icon: <AssessmentIcon />, path: '/canvassing' },
    { text: 'Redistricting', icon: <SettingsIcon />, path: '/redistricting' },
    { text: 'Territories', icon: <BillingIcon />, path: '/territories' },
    { text: 'Billing', icon: <BillingIcon />, path: '/billing' },
    { text: 'Admin', icon: <SettingsIcon />, path: '/admin/users' },
  ]

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          CampaignManager
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Political Campaign Management System
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationCenter />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {user?.phone_number}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout