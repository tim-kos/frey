resource "aws_security_group" "sg-1-default" {
    name        = "default"
    description = "default group"
    vpc_id      = ""

    ingress {
        from_port       = 0
        to_port         = 65535
        protocol        = "tcp"
        self            = true
    }

    ingress {
        from_port       = 0
        to_port         = 65535
        protocol        = "udp"
        self            = true
    }

    ingress {
        from_port       = -1
        to_port         = -1
        protocol        = "icmp"
        self            = true
    }

    ingress {
        from_port       = 22
        to_port         = 22
        protocol        = "tcp"
        cidr_blocks     = ["0.0.0.0/0"]
    }

    ingress {
        from_port       = 80
        to_port         = 80
        protocol        = "tcp"
        cidr_blocks     = ["0.0.0.0/0"]
    }

    ingress {
        from_port       = 3000
        to_port         = 3000
        protocol        = "tcp"
        cidr_blocks     = ["0.0.0.0/0"]
    }

    ingress {
        from_port       = 5000
        to_port         = 5000
        protocol        = "tcp"
        cidr_blocks     = ["0.0.0.0/0"]
    }
}
