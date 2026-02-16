# Fix: Lambda Invoke Permission Error

## Error
```
User: arn:aws:iam::281502313273:user/remotion_user is not authorized to perform: 
lambda:InvokeFunction on resource: arn:aws:lambda:us-east-1:281502313273:function:ffmpeg-clip-cutter 
because no identity-based policy allows the lambda:InvokeFunction action
```

## Solution: Add Lambda Invoke Permission to User

Your IAM user `remotion_user` needs permission to invoke Lambda functions.

### Steps to Fix:

1. **Go to IAM Console**: [IAM Users](https://console.aws.amazon.com/iam/home#/users)
2. **Click on `remotion_user`**
3. **Go to "Permissions" tab**
4. **Click "Add permissions" → "Create inline policy"**
5. **Select "JSON" tab**
6. **Paste this policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:us-east-1:281502313273:function:ffmpeg-clip-cutter",
        "arn:aws:lambda:us-east-1:281502313273:function:ffmpeg-clip-cutter:*"
      ]
    }
  ]
}
```

**Or for all Lambda functions in your account** (more permissive):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:281502313273:function:*"
    }
  ]
}
```

7. **Click "Next"**
8. **Name the policy**: `LambdaInvokePermission`
9. **Click "Create policy"**

### Verify

After adding the policy, test again. The error should be resolved.

## Alternative: Update Existing User Policy

If you already have an inline policy for `remotion_user`, you can add the Lambda permission to it:

1. Go to IAM → Users → `remotion_user` → Permissions
2. Find your existing inline policy
3. Click "Edit"
4. Add this statement to the existing policy:

```json
{
  "Effect": "Allow",
  "Action": [
    "lambda:InvokeFunction"
  ],
  "Resource": "arn:aws:lambda:us-east-1:281502313273:function:*"
}
```

5. Save the policy

## Complete User Permissions Checklist

Your `remotion_user` should have permissions for:
- ✅ S3 access (for Remotion Lambda - already configured)
- ✅ Lambda invoke (for FFmpeg clip cutting - **needs to be added**)
- ✅ Other Remotion Lambda permissions (already configured)
