npx ng build  --configuration=production && npx cap copy
npx cap sync --inline
cp src/.htaccess www/.htaccess