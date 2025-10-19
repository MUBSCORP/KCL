'use client';
import { List, ListItemButton, ListItemIcon, ListItemText, Drawer } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WarningIcon from '@mui/icons-material/Warning';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
    { href: '/protected/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { href: '/protected/alarms', icon: <WarningIcon />, label: 'Alarms' },
    { href: '/protected/devices', icon: <DevicesIcon />, label: 'Devices' },
    { href: '/protected/settings', icon: <SettingsIcon />, label: 'Settings' },
];

export default function AppSidebar() {
    const pathname = usePathname();
    return (
        <Drawer variant="permanent" PaperProps={{ sx: { width: 220 } }}>
            <List>
                {items.map((it) => (
                    <Link key={it.href} href={it.href}>
                        <ListItemButton selected={pathname?.startsWith(it.href)}>
                            <ListItemIcon>{it.icon}</ListItemIcon>
                            <ListItemText primary={it.label} />
                        </ListItemButton>
                    </Link>
                ))}
            </List>
        </Drawer>
    );
}
