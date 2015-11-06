# Create the HTML
echo "Creating front page HTML"
perl config/template.pl --overwrite --mode advanced templates/index.html index.html

echo "Creating beginner HTML"
perl config/template.pl --overwrite --mode beginner templates/level.html beginner.html

echo "Creating intermediate HTML"
perl config/template.pl --overwrite --mode intermediate templates/level.html intermediate.html

echo "Creating advanced HTML"
perl config/template.pl --overwrite --mode advanced templates/level.html advanced.html

# Create config JSON
echo "Creating JSON"
perl config/config.pl

# Create the CSS
echo "Creating CSS"
sass css/style.scss css/style.css