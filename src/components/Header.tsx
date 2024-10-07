import React, { ReactNode } from 'react';

interface HeaderProps {

    children: ReactNode;
  
}

const Header : React.FC<HeaderProps> = ({ children }) => {
    return (
        <header className="bg-white shadow">
            <div className="container mx-auto px-4 py-4 flex justify-between">
                <h1 className="text-xl font-bold">Mon Application</h1>
                {children}
            </div>
        </header>
    )
}

export default Header;