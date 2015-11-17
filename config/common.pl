sub loadLanguage {
	my ($lang,$line,@lines,$key,$value,%temp);
	$lang = $_[0];
	if(!-e $lang){
		print "ERROR: Can't load $lang.\n";
		return;
	}
	print "Loading $lang\n";
	open(YAML,$lang);
	@lines = <YAML>;
	close(YAML);
	
	foreach $line (@lines){
		$line =~ s/[\n\r]//g;
		if($line !~ /^\-\-\-/ && $line !~ /^\.\.\./){
			$line =~ s/[\s\t]+\#[^\#]*$//;
			$line =~ s/^([^\:]*)\:[\t\s]+/$1====/g;
			($key,$value) = split(/====/,$line);
			$temp{$key} = $value;
		}
	}
	return %temp;	
}

use JSON::PP;

%config;

sub loadConfig {
	my ($file,$line,@lines,$json,$pp);
	$file = $_[0];
	if(!-e $file){
		print "ERROR: Can't load $file.\n";
		return;
	}
	print "Loading $file\n";
	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);
	
	$json = "";
	foreach $line (@lines){
		$json .= $line;
	}
	$pp = JSON::PP->new;
	$pp = $pp->canonical([true]);
	$config = $pp->utf8->decode( $json );
}
1;