import React from 'react';
import styles from './ThemeSwitch.module.css';

interface ThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const ThemeSwitch = ({ checked, onChange }: ThemeSwitchProps) => {
  return (
    <div className={styles.wrapper}>
      <label className={styles.switch}>
        <input 
          id="checkbox" 
          type="checkbox" 
          checked={checked} 
          onChange={onChange}
        />
        <span className={styles.slider}>
          <div className={`${styles.star} ${styles.star_1}`} />
          <div className={`${styles.star} ${styles.star_2}`} />
          <div className={`${styles.star} ${styles.star_3}`} />
          <svg viewBox="0 0 16 16" className={`${styles.cloud} ${styles.cloud_1}`}>
            <path transform="matrix(.77976 0 0 .78395-299.99-418.63)" fill="#fff" d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925" />
          </svg>
        </span>
      </label>
    </div>
  );
}

export default ThemeSwitch;
