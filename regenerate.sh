# Create config JSON
echo "Creating JSON"
perl config/config.pl

# Create the HTML
echo "Creating front page HTML"
perl config/template.pl --overwrite --mode advanced templates/index.html index.html
perl config/template.pl --overwrite --mode advanced --lang cy templates/index.html index_cy.html

echo "Creating beginner HTML"
perl config/template.pl --overwrite --mode beginner templates/level.html beginner.html
perl config/template.pl --overwrite --mode beginner --lang cy templates/level.html beginner_cy.html

echo "Creating intermediate HTML"
perl config/template.pl --overwrite --mode intermediate templates/level.html intermediate.html
perl config/template.pl --overwrite --mode intermediate --lang cy templates/level.html intermediate_cy.html

echo "Creating advanced HTML"
perl config/template.pl --overwrite --mode advanced templates/level.html advanced.html
perl config/template.pl --overwrite --mode advanced --lang cy templates/level.html advanced_cy.html

echo "Creating launch HTML"
perl config/template.pl --overwrite --mode advanced templates/launch.html launch.html
perl config/template.pl --overwrite --mode advanced --lang cy templates/launch.html launch_cy.html

# Create the CSS
echo "Creating CSS"
sass css/style.scss css/style.css

# # Create the images
# # Now moved to separate file (updateimage.sh)
# echo "Updating images"
# perl config/textures.pl