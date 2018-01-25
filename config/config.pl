#!/usr/bin/perl

#use JSON::PP;
#$scalar = JSON::PP->new->utf8->decode( $json );
#foreach $my (keys(%{$scalar->{'package'}})){
#	print "$my: ".$scalar->{'package'}{$my}{'title'}."\n";
#}

# We need to temporarily include the base directory
# of this perl script on the include path
BEGIN{ if($0 =~ /^(.*\/)[^\/]+/){ unshift @INC, $1 } }

# Require the common file
use lib './';
require('common.pl');

# Update the base directory
$basedir = "./";
if($0 =~ /^(.*\/)[^\/]+/){ $basedir = $1; }

@versions = ('options_advanced.json','options_intermediate.json','options_beginner.json');

# Find all the language files
@langs = ();
# Open directory
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
	my ($lang,$line,@lines,$key,$value,%keys,$scalar,$code,$level);
	$lang = $_[0];

	($code,$level) = split(/_/,$lang);

	%keys = loadLanguage($basedir.$lang.".yaml");

	foreach $v (@versions){
		$json = "";
		if(-e $basedir.$v && $v =~ /$level/){
			print "    $v";
			open(FILE,$basedir.$v);
			@lines = <FILE>;
			close(FILE);
			$msg = "";
			foreach $line (@lines){
				while($line =~ /%([^%]+)%/){
					$key = $1;
					$replace = ($keys{$key}) ? $keys{$key} : "";
					$replace =~ s/\"/\\\"/g;
					if(!$keys{$key}){ $msg .= "WARNING: Couldn't find text for the key \%$key\$\n"; }
					$line =~ s/%$key%/$replace/;
				}
				$json .= $line;
			}
			$new = $lang."_options.json";
			print " -> $new\n";
			if($msg){ print "$msg"; }
			open(JSON,">",$basedir.$new);
			print JSON $json;
			close(JSON);

		}
	}
	print "\n";

}
