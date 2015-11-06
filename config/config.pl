#!/usr/bin/perl

@versions = ('options_advanced.json','options_intermediate.json','options_beginner.json');

$basedir = "./";
if($0 =~ /^(.*\/)[^\/]+/){
	$basedir = $1;
}

%keys;

# Find all the language files
@langs = ();
# Open astronaut directory
opendir($dh,$basedir);
while(my $file = readdir $dh) {
	if($file =~ /^(.*).yaml$/i){
		push(@langs,$1);
	}
}
closedir($dh);

foreach $lang (@langs){
	processLanguage($lang);
}

sub processLanguage {
	my ($lang,$line,@lines,$key,$value);
	$lang = $_[0];

	print "Loading $lang.yaml\n";
	open(YAML,$basedir.$lang.".yaml");
	@lines = <YAML>;
	close(YAML);
	
	foreach $line (@lines){
		$line =~ s/[\n\r]//g;
		if($line !~ /^\-\-\-/ && $line !~ /^\.\.\./){
			$line =~ s/[\s\t]+\#[^\#]*$//;
			($key,$value) = split(/:[\t\s]+/,$line);
			$keys{$key} = $value;
			#print "$key = $value\n";
		}
	}
	
	foreach $v (@versions){
		$json = "";
		if(-e $basedir.$v){
			print "    $v";
			open(FILE,$basedir.$v);
			@lines = <FILE>;
			close(FILE);
			foreach $line (@lines){
				while($line =~ /%([^%]+)%/){
					$key = $1;
					$replace = ($keys{$key}) ? $keys{$key} : "";
					if(!$keys{$key}){ print "\nWARNING: Couldn't find text for the key \%$key\$\n"; }
					$line =~ s/%$key%/$replace/;
				}
				$json .= $line;
			}
			$new = $lang."_options.json";
	
			print " -> $new";
			open(JSON,">",$basedir.$new);
			print JSON $json;
			close(JSON);
		}
	}
	print "\n";
	
}